import { createContext, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { Message } from "./types";

type MessagesContextType = {
    messages: Message[],
    setMessages: Dispatch<SetStateAction<Message[]>>,
}
type TitleContextType = {
    title: string,
    setTitle: Dispatch<SetStateAction<string>>,
}
type UserMessageContextType = {
    userMessage: string,
    setUserMessage: Dispatch<SetStateAction<string>>,
}
type ButtonContextType = {
    showKB: boolean,
    setShowKB: Dispatch<SetStateAction<boolean>>,
}

export const ButtonContext = createContext<ButtonContextType>({ showKB: true, setShowKB: () => {} });
export const MessagesContext = createContext<MessagesContextType>({
    messages: [],
    setMessages: () => {}
});
export const TitleContext = createContext<TitleContextType>({
    title: "",
    setTitle: () => {}
});
export const UserMessageContext = createContext<UserMessageContextType>({
    userMessage: "",
    setUserMessage: () => {}
});

type ChatContextProps = {
    children: ReactNode,
    messages: Message[],
    title: string,
    userMessage: string,
    setMessages: Dispatch<SetStateAction<Message[]>>,
    setTitle: Dispatch<SetStateAction<string>>,
    setUserMessage: Dispatch<SetStateAction<string>>,
}


export function ChatContextProvider (props: ChatContextProps) {
    return (
        <MessagesContext value={{messages: props.messages, setMessages: props.setMessages}}>
            <TitleContext value={{title: props.title, setTitle: props.setTitle}}>
                <UserMessageContext value={{userMessage: props.userMessage, setUserMessage: props.setUserMessage}}>
                    {props.children}
                </UserMessageContext>
            </TitleContext>
        </MessagesContext>
    )
}
