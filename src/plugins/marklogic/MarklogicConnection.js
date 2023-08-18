import marklogic from 'marklogic';
import ora from 'ora';

class MarklogicConnection {
  #connection = null;

  constructor({
    database,
    hostname,
    port,
    user,
    password,
    populate,
    connection_timeout,
  }) {
    this.database = database ?? 'map';
    this.user = user;
    this.hostname = hostname ?? 'localhost';
    this.port = port ?? 8000;
    this.password = password;
    this.populate = populate ?? false;
    this.connection_timeout = connection_timeout ?? 60_000;
  }

  async connect() {
    const console_connection = ora({
      discardStdin: false,
      text: 'Creating MarkLogic connection',
    }).start();

    if (this.populate) {
      try {
        const deleteConnection = this.#connectWithTimeout({
          timeout: this.connection_timeout,
          database: this.database,
        });

        console_connection.succeed('Connected to MarkLogic');

        const query = deleteConnection.documents.query(
          marklogic.queryBuilder.where(marklogic.queryBuilder.collection())
        );
        const results = await deleteConnection.documents.query(query).result();

        // Monta um array de URIs dos documentos
        const urisToDelete = results.map((result) => result.uri);

        // Deleta os documentos pelos URIs
        await deleteConnection.documents.remove(urisToDelete);
      } catch (error) {
        console.log(error);
        console_connection.fail('Failed to connect to MarkLogic');
        throw error;
      }
    }

    try {
      this.#connection = await this.#connectWithTimeout({
        timeout: this.connection_timeout,
        database: this.database,
      });

      console_connection.succeed('Connected to MarkLogic');
    } catch (error) {
      console.log(error);
      console_connection.fail('Failed to connect to MarkLogic');
      throw error;
    }
  }

  async disconnect() {
    if (this.#connection) {
      await this.#connection.close();
      this.#connection = null;
    }
  }

  async #connectWithTimeout({ timeout, database }) {
    const retryInterval = 5_000;
    const startTime = Date.now();

    var dbConfig = marklogic.createDatabaseClient({
      host: this.hostname,
      port: this.port,
      database,
      user: this.user,
      password: this.password,
      authType: 'DIGEST',
    });

    const db = marklogic.createDatabaseClient(dbConfig);

    let lastError = null;

    while (Date.now() - startTime < timeout) {
      try {
        const query = db.documents.query(
          marklogic.queryBuilder.where(
            marklogic.queryBuilder.collection('test')
          )
        );
        await db.documents.query(query).result();

        return db;
      } catch (error) {
        lastError = error;
        console.log(error);
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      }
    }

    throw new Error(
      `Database connection timeout after attempt for ${timeout}ms\n\n`,
      lastError
    );
  }
}

export default MarklogicConnection;
