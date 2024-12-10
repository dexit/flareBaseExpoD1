export default {
    fetch: async (request, env, ctx) => {
        return new Response('Hello World!');
    }
};

export const config = {
    compatibility_flags: ["nodejs_compat"]
};