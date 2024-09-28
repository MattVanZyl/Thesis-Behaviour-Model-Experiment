import { v4 as uuidv4 } from 'uuid';
import GraphViewType from '../../../../enums/GraphViewType';

export default class BaseGraph {
  constructor(viewType, logData, serviceName, subProcessName) {
    this.id = 'graph-' + uuidv4();
    this.viewType = viewType;
    this.nodes = {};
    this.edges = {};
    this.logData = logData;
    this.serviceName = serviceName;
    this.subProcessName = subProcessName;

    // Initialize logStatements based on viewType
    if (viewType === GraphViewType.SINGLE) {
      this.logStatements = new Set(logData.log_statements.map((s) => s.logging_statement_id));
      this.highestCount = 0;
    } else if (viewType === GraphViewType.CONTRAST) {
      this.logStatements_A = new Set(logData.A.log_statements.map((s) => s.logging_statement_id));
      this.logStatements_B = new Set(logData.B.log_statements.map((s) => s.logging_statement_id));

      this.highestCount_A = 0;
      this.highestCount_B = 0;
      this.maxCountDifference = 0;
      this.minCountDifference = 0;
    }

    this.services = this.findUniqueEntities('service');
    this.subprocesses = this.findUniqueEntities('subprocess');
    // this.classes = this.findUniqueEntities('class');
    // this.methods = this.findUniqueEntities('method');
    // this.files = this.findUniqueEntities('files');
  }

  calculateCounts() {
    const calculateDifferences = (entity) => {
      if (this.viewType === GraphViewType.CONTRAST) {
        const difference = entity.countDifference;
        this.maxCountDifference = Math.max(this.maxCountDifference, difference);
        this.minCountDifference = Math.min(this.minCountDifference, difference);
      }
    };

    // Calculate for nodes
    Object.values(this.nodes).forEach((node) => {
      if (this.viewType === GraphViewType.CONTRAST) {
        if (node.in_A) {
          this.highestCount_A = Math.max(this.highestCount_A, node.count_A);
        }
        if (node.in_B) {
          this.highestCount_B = Math.max(this.highestCount_B, node.count_B);
        }
        calculateDifferences(node);
      } else if (this.viewType === GraphViewType.SINGLE) {
        this.highestCount = Math.max(this.highestCount, node.count);
      }
    });

    // Calculate for edges
    Object.values(this.edges).forEach((edge) => {
      if (this.viewType === GraphViewType.CONTRAST) {
        if (edge.in_A) {
          this.highestCount_A = Math.max(this.highestCount_A, edge.count_A);
        }
        if (edge.in_B) {
          this.highestCount_B = Math.max(this.highestCount_B, edge.count_B);
        }
        calculateDifferences(edge);
      } else if (this.viewType === GraphViewType.SINGLE) {
        this.highestCount = Math.max(this.highestCount, edge.count);
      }
    });
  }

  findLogsByLogStatementId(logStatementID) {
    // Function to find log statements and logs
    const findLogs = (logData) => {
      const logStatement = logData.log_statements.find(
        (item) => String(item.logging_statement_id) === String(logStatementID)
      );

      if (logStatement) {
        const logs = logData.logs.filter(
          (log) => String(log.logging_statement_id) === String(logStatementID)
        );
        return { logStatement, logs };
      }

      return { logStatement: null, logs: null };
    };

    if (this.viewType === GraphViewType.SINGLE) {
      // Handle for GraphViewType.SINGLE viewType
      const result = findLogs(this.logData);
      return {
        logStatement: result.logStatement,
        logs: result.logs
      };
    } else if (this.viewType === GraphViewType.CONTRAST) {
      // Handle for GraphViewType.CONTRAST viewType
      const result_A = findLogs(this.logData.A);
      const result_B = this.logData.B
        ? findLogs(this.logData.B)
        : { logStatement: null, logs: null };

      return {
        logStatement: result_A.logStatement || result_B.logStatement,
        logs: {
          A: result_A.logs,
          B: result_B.logs
        }
      };
    }

    return null;
  }

  // ================================================================================
  findUniqueEntities(entityKey) {
    const uniqueEntities = new Set();

    // Filter based on the unique log statements
    const filterEntities = (logData, logStatementsSet) => {
      if (logData && logData.log_statements) {
        logData.log_statements.forEach((statement) => {
          if (statement[entityKey] && logStatementsSet.has(statement.logging_statement_id)) {
            uniqueEntities.add(statement[entityKey]);
          }
        });
      }
    };

    // Handle based on viewType
    if (this.viewType === GraphViewType.SINGLE) {
      this.logStatements = new Set(this.logData.log_statements.map((s) => s.logging_statement_id));
      filterEntities(this.logData, this.logStatements);
    } else if (this.viewType === GraphViewType.CONTRAST) {
      this.logStatements_A = new Set(
        this.logData.A.log_statements.map((s) => s.logging_statement_id)
      );
      this.logStatements_B = new Set(
        this.logData.B.log_statements.map((s) => s.logging_statement_id)
      );

      // Use separate log statements sets for A and B
      filterEntities(this.logData.A, this.logStatements_A);
      filterEntities(this.logData.B, this.logStatements_B);
    }
    return Array.from(uniqueEntities);
  }

  findNodesByField(fieldName, value) {
    return Object.values(this.nodes).filter(
      (node) => node.logStatement && node.logStatement[fieldName] === value
    );
  }

  getNode(nodeId) {
    return this.nodes[nodeId];
  }
}
