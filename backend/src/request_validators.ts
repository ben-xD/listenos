import Ajv, {Schema} from "ajv";
import {ErrorObject, ValidateFunction} from "ajv/lib/types";
import Any = jasmine.Any;

const ajv = new Ajv()

export const validateWith = (schema: Schema, json: unknown): ErrorObject[] | null => {
    const validator = ajv.compile(schema)
    const isValid = validator(json)
    if (isValid) {
        return null
    } else {
        return validator.errors ?? null
    }
}

export const createSessionRequestBodySchema = {
    type: "object",
    properties: {
        author: {type: "string"}
    },
    required: ["author"],
    additionalProperties: false
}

export interface CreateSessionRequestBody {
    author: string
}

export const CreateQuestionRequestBodySchema = {
    type: "object",
    properties: {
        id: {type: "string"},
        text: {type: "string"},
        author: {type: "string"},
    },
    required: ["id", "author", "text"],
    additionalProperties: false
}

export interface CreateQuestionRequestBody {
    id: string
    text: string
    author: string
}

export const CreateAnswerRequestBodySchema = {
    type: "object",
    properties: {
        question_id: {type: "string"},
        id: {type: "string"},
        text: {type: "string"},
        author: {type: "string"},
    },
    required: ["question_id", "id", "author", "text"],
    additionalProperties: false
}

export interface CreateAnswerRequestBody {
    question_id: string
    id: string
    text: string
    author: string
}