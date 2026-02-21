export async function POST(request: Request) {
    try{
        let requestData = await request.json();
        console.log('Received data:', requestData.mydata);

        return new Response('Data received successfully');
    } catch (error) {
        console.error('Error processing request:', error);
        return new Response('Error processing request', { status: 500 });
    }
}

