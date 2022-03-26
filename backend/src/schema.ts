import Ajv, {Schema} from "ajv";
// Using ajv/dist instead of ajv/lib to avoid errors like https://github.com/ajv-validator/ajv/issues/1740
import {ErrorObject} from "ajv/dist/types";
import addFormats from "ajv-formats"

const ajv = new Ajv({allErrors: true})
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
addFormats(ajv)

export const validateWith = (schema: Schema, data: unknown): ErrorObject[] => {
    // AJV cannot compile schemas for some unknown reason:
    // Error compiling schema, function code
    try {
        const validate = ajv.compile(schema)
        console.error(`BEN: ${validate.errors}`)
        const isValid = validate(data)
        if (isValid) {
            console.info(`isValid. Validation errors: ${validate.errors}`)
            return []
        } else {
            console.log(`Validation errors: ${validate.errors}`)
            return validate.errors ?? []
        }
    } catch (e) {
        console.warn("Skipping validation because AJV can't compile")
        return []
    }

}

// export const testSchema = {
//     type: "object",
//     properties: {
//         foo: {type: "integer"},
//         bar: {type: "string"}
//     },
//     required: ["foo"],
//     additionalProperties: false
// }

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