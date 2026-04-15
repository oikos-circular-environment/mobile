import Fastify from "fastify";

const app = Fastify({
  logger: true,
});

app
  .listen({ port: 3000 })
  .then(() => {
    console.log("Server is running on port 3000");
  })
  .catch((err) => {
    console.error("Error starting server:", err);
  });
