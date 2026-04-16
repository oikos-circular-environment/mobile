import { hash } from "bcryptjs";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { createUserSchema, userSchema } from "./entities/user";
import { UserAlreadyExistsError } from "./errors/user-already-exists-error";
import { InMemoryUsersRepository } from "./repositories/in-memory/in-memory-users-repositories";

const usersRepository = new InMemoryUsersRepository();

export async function usersRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/",
    {
      schema: {
        tags: ["Users"],
        summary: "Get a list of users",
        description: "Returns a list of all users in the system.",
        response: {
          200: z.array(userSchema),
        },
      },
    },
    async (_request, reply) => {
      const users = await usersRepository.findAll();
      return reply.send(users);
    },
  );

  typedApp.post(
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

      const password_hash = await hash(password, 6);

      const userWithSameEmail = await usersRepository.findByEmail(email);

      if (userWithSameEmail) {
        throw new UserAlreadyExistsError();
      }

      const user = await usersRepository.create({
        name,
        email,
        password: password_hash,
      });

      reply.send(user);
    },
  );
}
