from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agent import SQLQueryGenerator

class Question(BaseModel):
    question: str

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

query_generator = SQLQueryGenerator(db_uri='sqlite:///Chinook.db')

@app.get("/")
async def index():
    return {'message': 'Hello, World!'}


@app.post("/ask")
async def ask_question(question: Question):
    try:
        print("The question is", question.question)
        return StreamingResponse(query_generator.run(question.question), media_type="text/plain")
    
    except Exception as exception:
        print(exception)
        return {'message': 'This question is irrelevant to the database'}