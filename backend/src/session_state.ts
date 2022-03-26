import {
    Answer,
    EventType,
    NewAnswerEvent,
    NewQuestionEvent,
    Question,
    Session,
    SessionDeleted,
    SyncEvent
} from "./types";
import {CreateAnswerRequestBody, CreateQuestionRequestBody, CreateSessionRequestBody} from "./schema";

export class SessionState {
    private readonly storage: DurableObjectStorage;
    private readonly onEvent: (syncEvent: SyncEvent) => void

    constructor(state: DurableObjectState, onEvent: (syncEvent: SyncEvent) => void) {
        if (!state.storage) {
            throw new Error("state.storage was null");
        }
        this.storage = state.storage;
        this.onEvent = onEvent
    }

    async deleteSession(): Promise<void> {
        console.info("Deleting durable object data")
        await this.storage.deleteAll()
        const id = await this.storage.get<string>("id")
        if (id === undefined) {
            // Doesn't even exist.
            return
        }
        const body: SessionDeleted = {
            session_id: id
        }
        this.onEvent({type: EventType.SessionDeleted, payload: body})
    }

    // TODO replace user provided IDs with UUID
    async createQuestion(body: CreateQuestionRequestBody): Promise<void> {
        const session_id = await this.getSessionId()
        const question: Question = {
            text: body.text,
            id: body.id,
            createdAt: new Date(),
            answers: [],
            author: body.author
        }
        await this.saveQuestion(question)
        const payload: NewQuestionEvent = {
            session_id: await this.getSessionId(),
            createdAt: question.createdAt,
            author: question.author,
            id: question.id,
            text: question.text
        }
        this.onEvent({type: EventType.NewQuestion, payload: payload})
    }

    async createAnswer(body: CreateAnswerRequestBody): Promise<void> {
        const session_id = await this.getSessionId()
        const answer: Answer = {
            text: body.text,
            id: body.id,
            createdAt: new Date(),
            author: body.author
        }
        const question = await this.getQuestion(body.question_id)
        question.answers.push(answer)
        await this.saveQuestion(question)
        const payload: NewAnswerEvent = {
            createdAt: answer.createdAt,
            author: answer.author,
            session_id: session_id,
            id: question.id,
            question_id: question.id,
            text: answer.text
        }
        this.onEvent({
            type: EventType.NewAnswer,
            payload: payload
        })
    }

    async getSnapshot(): Promise<Session> {
        console.log("Getting Session snapshot")
        const id = await this.storage.get<string>("id")
        const author = await this.storage.get<string>("author")
        const createdAt = await this.storage.get<Date>("createdAt")
        const questionIds = await this.storage.get<Set<string>>("questionIds")
        if (id === undefined || author === undefined || createdAt == undefined || questionIds === undefined) {
            throw Error("Illegal state. Initial session metadata not set.")
        }
        const questions: Question[] = []
        for (const questionId of questionIds) {
            const question = await this.storage.get<Question>(questionId)
            if (question === undefined) {
                throw Error(`Illegal state. Question ID ${questionId} data is missing but it is stored in the questionIds list.`)
            }
            questions.push(question)
        }

        const session: Session = {
            id: id,
            author: author,
            createdAt: createdAt,
            questions: questions
        }
        return session;
    }

    async createSession(id: string, body: CreateSessionRequestBody): Promise<void> {
        // FIXME I can merge these key/values into a "Metadata" object instead of having them separate.
        await this.storage.put("id", id)
        await this.storage.put("createdAt", new Date())
        await this.storage.put("author", body.author)
        await this.storage.put("questionIds", new Set())
    }

    private async getQuestion(id: string): Promise<Question> {
        const question = await this.storage.get<Question>(id)
        if (question === undefined) {
            throw Error(`Question with ID ${id} was not found.`)
        }
        return question
    }

    private async saveQuestion(question: Question): Promise<void> {
        const questionIds = await this.storage.get<Set<string>>("questionIds")
        console.log(questionIds instanceof Set)
        questionIds?.add(question.id)
        await this.storage.put("questionIds", questionIds)
        await this.storage.put(question.id, question)
    }

    private async getSessionId(): Promise<string> {
        const id = await this.storage.get<string>("id")
        if (id === undefined) {
            throw Error(`Session does not have ID, so it doesn't exist.`)
        }
        return id
    }

    private async getAnswer(id: string): Promise<Answer> {
        const answer = await this.storage.get<Answer>(id)
        if (answer === undefined) {
            throw Error(`Answer with ${id} does not exist`)
        }
        return answer
    }
}