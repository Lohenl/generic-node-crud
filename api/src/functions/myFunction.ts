import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function myFunction(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        if (request.method === 'GET') {
            return { jsonBody: { abc: '123-get' } };

        } else if (request.method === 'POST') {
            return { jsonBody: { abc: '123-post' } };

        } else if (request.method === 'PATCH') {
            return { jsonBody: { abc: '123-patch' } };

        } else if (request.method === 'DELETE') {
            return { jsonBody: { abc: '123-delete' } };
        }

    } catch (error) {
        context.error('myFunction: error encountered:', error);
        if (error?.message?.startsWith('unauthorized')) { return { status: 403, body: error } };
        return { status: 500, body: `Unexpected error occured: ${error}` };
    }
}

app.http('myfunction', {
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    authLevel: 'anonymous',
    handler: myFunction
});
