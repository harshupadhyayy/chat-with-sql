from langchain_core.prompts import ChatPromptTemplate
from langchain_community.utilities import SQLDatabase
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from dotenv import load_dotenv
import os

load_dotenv()

class SQLQueryGenerator:
    def __init__(self, db_uri):
        api_key = os.getenv("OPENAI_API_KEY")
        
        if not api_key:
            raise ValueError("OpenAI API key not found. Please set it in the .env file.")
        

        self.db = SQLDatabase.from_uri(database_uri=db_uri)
        self.llm = ChatOpenAI(
            temperature=0,
            model="gpt-3.5-turbo",
            streaming=True,
            callbacks=[StreamingStdOutCallbackHandler()]
        )

        self.query_prompt = ChatPromptTemplate.from_template(
            template="""
            Based on the schema below, write a SQL query that would answer the user's question:
            {schema}

            Question: {question}
            SQL Query:
            """
        )

        self.response_prompt = ChatPromptTemplate.from_template(
            template="""
            Based on the table schema below, question, sql query, and sql response, write a natural language response:
            {schema}

            Question: {question}
            SQL Query: {query}
            SQL Response: {response}"""
        )

    def get_schema(self, _):
        return self.db.get_table_info()

    def generate_sql_chain(self):
        return (
            RunnablePassthrough.assign(schema=self.get_schema)
            | self.query_prompt
            | self.llm.bind(stop=["\nSQLResult:"])
            | StrOutputParser()
        )

    def run_query(self, query):
        return self.db.run(query)

    def generate_response_chain(self):
        return (
            RunnablePassthrough.assign(query=self.generate_sql_chain())
            .assign(
                schema=self.get_schema,
                response=lambda vars: self.run_query(vars["query"]),
            )
            | self.response_prompt
            | self.llm
        )

    async def run(self, question):
        response_chain = self.generate_response_chain()
        # return await response_chain.ainvoke({"question": question})
        async for token in response_chain.astream({"question": question}):
            if token.content:
                yield token.content