import { useState } from "react";
import { getHomePage, postQuestionFunction } from "./api/ApiManager";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "./components/ui/button";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { CornerDownLeft } from "lucide-react";

type ChatMessage = {
  role: string;
  content: string;
};

export const Chat = () => {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const { data, error, isPending, isError } = useQuery({
    queryKey: ["getIndex"],
    queryFn: getHomePage,
  });

  const mutation = useMutation({
    mutationFn: async (question: string) => {
      await postQuestionFunction(question, setResponse);
    },
    onSuccess: () => {
      console.log("Question successfully posted");
    },
  });

  const addMessage = (newMessage: ChatMessage) => {
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  const askQuestion = (question: string) => {
    if (question.length === 0) {
      setResponse("Question received is blank space");
      return;
    }

    if (response !== "") {
      const prevResponse: ChatMessage = {
        role: "ai",
        content: response,
      };
      addMessage(prevResponse);
    }

    const newMessage: ChatMessage = {
      role: "user",
      content: question,
    };
    addMessage(newMessage);
    setResponse("");
    setQuestion("");
    mutation.mutate(question);
  };

  const clearContent = () => {
    setQuestion("");
    setResponse("");
  };

  if (isPending) {
    return <div>Loading....</div>;
  }

  if (isError) {
    return <div>{error.message}</div>;
  }

  return (
    <>
      <main className="flex flex-col items-center max-w-xl w-full h-screen mx-auto p-12 bg-muted/50">
        <div>{data.message}</div>
        <ChatMessageList>
          {messages.map((message, index) => (
            <ChatBubble
              key={index}
              variant={message.role === "ai" ? "received" : "sent"}
            >
              <ChatBubbleAvatar src="ai" />
              <ChatBubbleMessage
                variant={message.role === "ai" ? "received" : "sent"}
              >
                {message.content}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}
          {response && (
            <ChatBubble variant={"received"}>
              <ChatBubbleAvatar />
              <ChatBubbleMessage>{response}</ChatBubbleMessage>
            </ChatBubble>
          )}
        </ChatMessageList>
        <div className="flex-1" />
        <ChatInput
          placeholder="Type your message here..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Button
          size="sm"
          className="ml-auto gap-1.5"
          onClick={() => askQuestion(question)}
        >
          Send Message
          <CornerDownLeft className="size-3.5" />
        </Button>
      </main>
    </>
  );
};
