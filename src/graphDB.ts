import neo4j, { Driver, Session } from "neo4j-driver"
import { promises as fs } from "fs" // Use promises interface for fs

class GraphDB {
  private driver: Driver
  private session: Session

  constructor() {
    this.driver = neo4j.driver(
      process.env.DB_URL as string,
      neo4j.auth.basic(
        process.env.DB_USERNAME as string,
        process.env.DB_PASSWORD as string
      )
    )
    this.session = this.driver.session()
    this.graphSearch = this.graphSearch.bind(this)
    this.initDB = this.initDB.bind(this)
    this.closeDB = this.closeDB.bind(this)
  }

  async initDB(): Promise<void> {
    try {
      // Read Cypher statements from seed.cyp
      const seedQuery = await fs.readFile("seed.cyp", "utf8")

      // Execute the Cypher query
      await this.session.run(seedQuery)
      console.log("Database has been seeded.")
    } catch (error) {
      console.error(error)
      throw new Error("DB failed to init")
    }
  }

  async graphSearch({ query }: { query: string }) {
    const result = await this.session.run(query)
    return result.records
  }

  async closeDB(): Promise<void> {
    await this.session.close()
    await this.driver.close()
  }
}

export default GraphDB
