import { OpenAI } from "openai" // Assuming 'openai' has TypeScript definitions
import { MessageContentText } from "openai/resources/beta/threads/messages/messages"
import GraphDB from "./graphDB"

// Assuming OPENAI_API_KEY is set in your .env file
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY as string })

const userPrompt = "Who is the son of Mary Lee Pfeiffer?"

const instructions = `**You are the 'GraphKnowledgeBot':** A Chatbot equipped to perform sophisticated queries on a Neo4j graph database. Your expertise lies in providing detailed and contextually relevant answers to user queries about people and their interconnections, utilizing the 'graph_search' tool.

**Instructions for Using the 'graph_search' Tool:**

1. **Understanding the Tool:**
   - The "graph_search" tool is specifically designed to interact with a Neo4j graph database. It excels in navigating intricate networks of people and their relationships, using Cypher, the query language for Neo4j.

2. **Identifying the User Query:**
   - Carefully interpret the user's query, with an emphasis on identifying key individuals, their relationships, and specific details or connections the user seeks to understand.

3. **Formulating the Cypher Query:**
   - Transform the user's query into a precise Cypher query. Focus on pinpointing the relevant nodes (people), the nature of their relationships (e.g., familial, professional, social), and pertinent properties. Ensure to include necessary conditions and filters to refine the search.

4. **Using the Tool:**
   - Input the carefully crafted Cypher query into the "graph_search" tool. Verify the query's accuracy and its alignment with the user's intentions.

5. **Interpreting Results:**
   - Analyze the results returned by "graph_search" for their relevance and accuracy in addressing the user's inquiry about specific people and their interconnections.

6. **Communicating the Outcome:**
   - Clearly and effectively communicate the findings from the "graph_search" to the user. Provide summaries or direct answers that elucidate the relationships and connections between the individuals in question.

**Example Usage:**

If a user asks about "the relationship between historical figures Alexander Hamilton and Aaron Burr," you would:

- Identify key elements: "relationship," "Alexander Hamilton," "Aaron Burr."
- Formulate the Cypher query: \`MATCH (p1:Person {name: 'Alexander Hamilton'})-[:HAD_RELATIONSHIP]->(p2:Person {name: 'Aaron Burr'}) RETURN p1.name, p2.name, type(r) AS Relationship\`
- Input the query into the tool and interpret the results.
`

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  try {
    const graphDB = new GraphDB()
    await graphDB.initDB()

    const tools: { [key: string]: Function } = {
      graph_search: graphDB.graphSearch,
    }

    // Create the GPT-4 assistant
    const assistant = await client.beta.assistants.create({
      model: "gpt-4-1106-preview",
      name: "GraphKnowledgeBot",
      instructions,
      tools: [
        {
          type: "function",
          function: {
            name: "graph_search",
            description:
              "Perform a graph-based search to retrieve contextually relevant information from a Neo4j database based on a user's query.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "A Cypher query string based on a user query.",
                },
              },
              required: ["query"],
            },
          },
        },
      ],
    })

    // Create a new thread
    const threadId = (await client.beta.threads.create()).id

    // Send the user's query
    await client.beta.threads.messages.create(threadId, {
      role: "user",
      content: userPrompt,
    })

    // Execute the assistant
    let run = await client.beta.threads.runs.create(threadId, {
      assistant_id: assistant.id,
    })

    // Check for the status of the run
    while (run.status === "queued" || run.status === "in_progress") {
      await sleep(1000)
      run = await client.beta.threads.runs.retrieve(threadId, run.id)
    }

    // If the assistant requires an action (like executing a tool function)
    if (run.status === "requires_action") {
      if (
        run.required_action?.submit_tool_outputs?.tool_calls[0].type ===
        "function"
      ) {
        const toolFunction =
          run.required_action.submit_tool_outputs.tool_calls[0].function
        const functionName = toolFunction.name
        const functionArguments = JSON.parse(toolFunction.arguments)

        // Call the function from the tools dictionary using the function name
        const result = await tools[functionName](functionArguments)
        run = await client.beta.threads.runs.submitToolOutputs(
          threadId,
          run.id,
          {
            tool_outputs: [
              {
                tool_call_id:
                  run.required_action.submit_tool_outputs.tool_calls[0].id,
                output: JSON.stringify(result),
              },
            ],
          }
        )

        // Wait for the run to complete
        while (run.status === "queued" || run.status === "in_progress") {
          await sleep(1000)
          run = await client.beta.threads.runs.retrieve(threadId, run.id)
        }
      }
    }

    // Retrieve and print all messages in the thread
    const messages = await client.beta.threads.messages.list(threadId)

    messages.data
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
      .forEach((message) => {
        console.log(
          `${message.assistant_id ? "Assistant" : "User"}: ${
            (message.content[0] as MessageContentText).text.value
          }`
        )
      })
    await graphDB.closeDB()
  } catch (err) {
    console.error("Error:", err)
  }
}

main()
