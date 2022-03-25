export interface UserErrorMessage {
    message: string,
    statusCode: number
}

/**
 * Entities Domain objects
 */
export interface Session {
    id: string
    author: string
    createdAt: Date
    questions: Question[]
}

export interface Question {
    id: string
    createdAt: Date
    text: string
    answers: Answer[]
    author: string
}

export interface Answer {
    id: string
    text: string
    author: string,
    createdAt: Date
}

/**
 * Sync Event types
 */
export interface SyncEvent {
    type: EventType
    payload: NewQuestionEvent | NewAnswerEvent | SessionDeleted
}

export enum EventType {
    NewQuestion = "newQuestion",
    NewAnswer = "newAnswer",
    SessionDeleted = "sessionDeleted"
}

export interface NewQuestionEvent {
    session_id: string
    id: string
    createdAt: Date
    text: string
    author: string
}

export interface NewAnswerEvent {
    session_id: string
    question_id: string
    id: string
    createdAt: Date
    text: string
    author: string
}

export interface SessionDeleted {
    session_id: string
}

