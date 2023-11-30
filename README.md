# Example OpenAI Assistants Knowledge Graph Search Tool

## Overview

This repo is the companion code repository for my blog post on leveraging Neo4j as a tool for an OpenAI Assistant to use.

## GraphKnowledgeBot

The GraphKnowledgeBot is an OpenAI Assistant designed to interact with a Neo4j graph database. It utilizes OpenAI's GPT-4 for natural language processing and is capable of executing complex graph-based queries. The bot's primary function is to provide contextually relevant answers to queries about people and their interconnections within a graph database.

## Structure

### GraphDB Class

- **Purpose**: Manages interactions with the Neo4j graph database.
- **Methods**:
  - `initDB()`: Initializes the database with predefined Cypher statements from `seed.cyp`.
  - `graphSearch(query)`: Executes a given Cypher query and returns the results.
  - `closeDB()`: Closes the database session and driver connection.

### OpenAI Integration

- **Setup**: Uses the `openai` package to create a GPT-4 powered assistant named "GraphKnowledgeBot".
- **Functionality**: Processes user queries, formulates appropriate Cypher queries, and communicates with the Neo4j database through the GraphDB class.

### Main Function

- Orchestrates the overall process, including initializing the GraphDB instance, creating the assistant, handling user queries, and executing the bot's logic.

## Installation

1. Ensure you have Node.js `v20` installed and docker.
2. Clone this repository.
3. Run `npm install` to install dependencies.
4. Set up your `.env` file at the root of this repo to correspond to the `example.env`, for setting the Neo4j database credentials and your OpenAI API key.

## Usage

To run the app:

1. Build the docker container and start the Neo4j database by running `sh build.sh` then `sh start.sh`.
2. Execute the `main` function by running `npm start`.
3. The app will initialize, connect to the Neo4j database, and create an OpenAI Assistant.
4. The app will then demonstrate an interaction with the assistant by giving it an example query.

## Example

Query: "Who is the son of Mary Lee Pfeiffer?"

The bot will:

- Parse the query to understand the context and the required information.
- Formulate a Cypher query to retrieve the relevant data from the Neo4j database.
- Return the results in a user-friendly format.
