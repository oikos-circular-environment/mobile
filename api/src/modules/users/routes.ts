import type { FastifyInstance } from "fastify";
import z from "zod";
import { createUserSchema, userSchema } from "./entities/user";

export async function usersRoutes(app: FastifyInstance) {
  app.get(
    "/",
    {
      schema: {
        tags: ["Users"],
        summary: "Get a list of users",
        description: "Returns a list of all users in the system.",
      },
    },
    async (request, reply) => {
      return reply.send({ message: "List of users" });
    },
  );

  app.post(
    "/register",
    {
      schema: {
        tags: ["Users"],
        summary: "Register a new user",
        description:
          "Creates a new user account with the provided information.",
        body: createUserSchema,
        response: {
          200: userSchema,
        },
      },
    },
    async (request, reply) => {
      const { name, email, password } = request.body;

      reply.send({ message: `User ${name} registered successfully` });
    },
  );
}
