import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as zlib from "node:zlib";
import * as plans from "@culpritsql/plans";
import type { Deadlock, Plan, PlanDiff } from "@culpritsql/plan-viewer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function buildExplainShareUrl(route: "compare" | "deadlock", payload: Record<string, unknown>): string {
  const raw = Buffer.from(JSON.stringify(payload), "utf8");
  const compressed = zlib.deflateRawSync(raw, { level: 9 });
  return `https://explain.culpritsql.com/${route}#s=z1.${compressed.toString("base64url")}`;
}

let wasmReady = false;

async function ensureNodeWasm(): Promise<void> {
  if (wasmReady) return;
  const wasmPath = path.resolve(
    __dirname,
    "../../node_modules/@culpritsql/plans/pkg/native/culprit_wasm_bg.wasm",
  );
  const wasmBytes = fs.readFileSync(wasmPath);
  await plans.init({ module_or_path: wasmBytes });
  wasmReady = true;
}

const MSSQL_BEFORE_KEY_LOOKUP_XML = `<ShowPlanXML xmlns="http://schemas.microsoft.com/sqlserver/2004/07/showplan" Version="1.564" Build="16.0.4295.3">
  <BatchSequence><Batch><Statements>
    <StmtSimple StatementText="SELECT TOP 50 o.id, c.name, o.total_cents, o.shipping_notes FROM shop.orders o JOIN shop.customers c ON c.id = o.customer_id WHERE o.status = 'shipped' ORDER BY o.created_at DESC" StatementId="1" StatementCompId="1" StatementType="SELECT" StatementSubTreeCost="14.82" StatementEstRows="50" StatementOptmLevel="FULL" CardinalityEstimationModelVersion="160">
      <QueryPlan DegreeOfParallelism="1" CachedPlanSize="64" CompileTime="14" CompileCPU="12">
        <MissingIndexes>
          <MissingIndexGroup Impact="91.4">
            <MissingIndex Database="[shop_prod]" Schema="[shop]" Table="[orders]">
              <ColumnGroup Usage="EQUALITY"><Column Name="[status]" ColumnId="4"/></ColumnGroup>
              <ColumnGroup Usage="INCLUDE"><Column Name="[customer_id]" ColumnId="2"/><Column Name="[total_cents]" ColumnId="5"/><Column Name="[shipping_notes]" ColumnId="8"/></ColumnGroup>
            </MissingIndex>
          </MissingIndexGroup>
        </MissingIndexes>
        <QueryTimeStats ElapsedTime="184" CpuTime="92"/>
        <RelOp NodeId="0" PhysicalOp="Top" LogicalOp="Top" EstimateRows="50" EstimateIO="0" EstimateCPU="0.00005" AvgRowSize="212" EstimatedTotalSubtreeCost="14.82" Parallel="0" EstimatedExecutionMode="Row">
          <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="50" ActualElapsedms="184" ActualCPUms="92" ActualExecutions="1" ActualExecutionMode="Row"/></RunTimeInformation>
          <Top RowCount="0" IsPercent="0" WithTies="0">
            <RelOp NodeId="1" PhysicalOp="Nested Loops" LogicalOp="Inner Join" EstimateRows="50" EstimateIO="0" EstimateCPU="0.024" AvgRowSize="212" EstimatedTotalSubtreeCost="14.81" Parallel="0" EstimatedExecutionMode="Row">
              <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="50" ActualElapsedms="183" ActualCPUms="91" ActualExecutions="1" ActualExecutionMode="Row"/></RunTimeInformation>
              <NestedLoops Optimized="0">
                <RelOp NodeId="3" PhysicalOp="Nested Loops" LogicalOp="Inner Join" EstimateRows="50" EstimateIO="0" EstimateCPU="0.18" AvgRowSize="148" EstimatedTotalSubtreeCost="13.94" Parallel="0" EstimatedExecutionMode="Row">
                  <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="18400" ActualElapsedms="169" ActualCPUms="82" ActualExecutions="1" ActualExecutionMode="Row"/></RunTimeInformation>
                  <NestedLoops Optimized="0">
                    <RelOp NodeId="5" PhysicalOp="Index Seek" LogicalOp="Index Seek" EstimateRows="120" EstimatedRowsRead="18400" EstimateIO="0.12" EstimateCPU="0.02" AvgRowSize="24" EstimatedTotalSubtreeCost="0.14" TableCardinality="2400000" Parallel="0" EstimatedExecutionMode="Row">
                      <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="18400" ActualElapsedms="18" ActualCPUms="14" ActualScans="1" ActualLogicalReads="94" ActualPhysicalReads="4" ActualExecutions="1" ActualExecutionMode="Row"/></RunTimeInformation>
                      <IndexScan Ordered="1" ScanDirection="BACKWARD" Storage="RowStore">
                        <Object Database="[shop_prod]" Schema="[shop]" Table="[orders]" Index="[ix_orders_status_created]" Alias="[o]" IndexKind="NonClustered" Storage="RowStore"/>
                      </IndexScan>
                    </RelOp>
                    <RelOp NodeId="7" PhysicalOp="Clustered Index Seek" LogicalOp="Clustered Index Seek" EstimateRows="1" EstimateIO="0.003125" EstimateCPU="0.0001581" AvgRowSize="132" EstimatedTotalSubtreeCost="13.62" TableCardinality="2400000" Parallel="0" EstimateRebinds="119" EstimatedExecutionMode="Row">
                      <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="18400" ActualElapsedms="146" ActualCPUms="64" ActualScans="0" ActualLogicalReads="56120" ActualPhysicalReads="1890" ActualExecutions="18400" ActualExecutionMode="Row"/></RunTimeInformation>
                      <IndexScan Lookup="1" Ordered="1" ScanDirection="FORWARD" Storage="RowStore">
                        <Object Database="[shop_prod]" Schema="[shop]" Table="[orders]" Index="[pk_orders]" Alias="[o]" IndexKind="Clustered" Storage="RowStore"/>
                      </IndexScan>
                    </RelOp>
                  </NestedLoops>
                </RelOp>
                <RelOp NodeId="8" PhysicalOp="Clustered Index Seek" LogicalOp="Clustered Index Seek" EstimateRows="1" EstimateIO="0.003125" EstimateCPU="0.0001581" AvgRowSize="76" EstimatedTotalSubtreeCost="0.84" TableCardinality="200000" Parallel="0" EstimateRebinds="49" EstimatedExecutionMode="Row">
                  <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="50" ActualElapsedms="12" ActualCPUms="8" ActualLogicalReads="152" ActualPhysicalReads="0" ActualExecutions="50" ActualExecutionMode="Row"/></RunTimeInformation>
                  <IndexScan Ordered="1" ScanDirection="FORWARD" Storage="RowStore">
                    <Object Database="[shop_prod]" Schema="[shop]" Table="[customers]" Index="[pk_customers]" Alias="[c]" IndexKind="Clustered" Storage="RowStore"/>
                  </IndexScan>
                </RelOp>
              </NestedLoops>
            </RelOp>
          </Top>
        </RelOp>
      </QueryPlan>
    </StmtSimple>
  </Statements></Batch></BatchSequence>
</ShowPlanXML>`;

const MSSQL_AFTER_COVERING_XML = `<ShowPlanXML xmlns="http://schemas.microsoft.com/sqlserver/2004/07/showplan" Version="1.564" Build="16.0.4295.3">
  <BatchSequence><Batch><Statements>
    <StmtSimple StatementText="SELECT TOP 50 o.id, c.name, o.total_cents, o.shipping_notes FROM shop.orders o JOIN shop.customers c ON c.id = o.customer_id WHERE o.status = 'shipped' ORDER BY o.created_at DESC" StatementId="1" StatementCompId="1" StatementType="SELECT" StatementSubTreeCost="0.21" StatementEstRows="50" StatementOptmLevel="FULL" CardinalityEstimationModelVersion="160">
      <QueryPlan DegreeOfParallelism="1" CachedPlanSize="32" CompileTime="4" CompileCPU="4">
        <QueryTimeStats ElapsedTime="3" CpuTime="2"/>
        <RelOp NodeId="0" PhysicalOp="Top" LogicalOp="Top" EstimateRows="50" EstimateIO="0" EstimateCPU="0.00005" AvgRowSize="212" EstimatedTotalSubtreeCost="0.21" Parallel="0" EstimatedExecutionMode="Row">
          <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="50" ActualElapsedms="3" ActualCPUms="2" ActualExecutions="1" ActualExecutionMode="Row"/></RunTimeInformation>
          <Top RowCount="0" IsPercent="0" WithTies="0">
            <RelOp NodeId="1" PhysicalOp="Nested Loops" LogicalOp="Inner Join" EstimateRows="50" EstimateIO="0" EstimateCPU="0.008" AvgRowSize="212" EstimatedTotalSubtreeCost="0.20" Parallel="0" EstimatedExecutionMode="Row">
              <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="50" ActualElapsedms="3" ActualCPUms="2" ActualExecutions="1" ActualExecutionMode="Row"/></RunTimeInformation>
              <NestedLoops Optimized="0">
                <RelOp NodeId="2" PhysicalOp="Index Seek" LogicalOp="Index Seek" EstimateRows="50" EstimatedRowsRead="50" EstimateIO="0.012" EstimateCPU="0.0004" AvgRowSize="148" EstimatedTotalSubtreeCost="0.013" TableCardinality="2400000" Parallel="0" EstimatedExecutionMode="Row">
                  <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="50" ActualElapsedms="1" ActualCPUms="1" ActualScans="1" ActualLogicalReads="5" ActualPhysicalReads="0" ActualExecutions="1" ActualExecutionMode="Row"/></RunTimeInformation>
                  <IndexScan Ordered="1" ScanDirection="BACKWARD" Storage="RowStore">
                    <Object Database="[shop_prod]" Schema="[shop]" Table="[orders]" Index="[ix_orders_status_created_covering]" Alias="[o]" IndexKind="NonClustered" Storage="RowStore"/>
                  </IndexScan>
                </RelOp>
                <RelOp NodeId="3" PhysicalOp="Clustered Index Seek" LogicalOp="Clustered Index Seek" EstimateRows="1" EstimateIO="0.003125" EstimateCPU="0.0001581" AvgRowSize="76" EstimatedTotalSubtreeCost="0.18" TableCardinality="200000" Parallel="0" EstimateRebinds="49" EstimatedExecutionMode="Row">
                  <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="50" ActualElapsedms="2" ActualCPUms="1" ActualLogicalReads="152" ActualPhysicalReads="0" ActualExecutions="50" ActualExecutionMode="Row"/></RunTimeInformation>
                  <IndexScan Ordered="1" ScanDirection="FORWARD" Storage="RowStore">
                    <Object Database="[shop_prod]" Schema="[shop]" Table="[customers]" Index="[pk_customers]" Alias="[c]" IndexKind="Clustered" Storage="RowStore"/>
                  </IndexScan>
                </RelOp>
              </NestedLoops>
            </RelOp>
          </Top>
        </RelOp>
      </QueryPlan>
    </StmtSimple>
  </Statements></Batch></BatchSequence>
</ShowPlanXML>`;

const MSSQL_DEADLOCK_XML = `<deadlock>
  <victim-list>
    <victimProcess id="process201"/>
  </victim-list>
  <process-list>
    <process id="process201" spid="74" clientapp="checkout-worker" loginname="app_checkout" hostname="worker-03" isolationlevel="read committed (2)" waitresource="KEY: 6:72057594041204736 (81944f3284a0)" waittime="1840" status="suspended" lastbatchstarted="2026-11-22T18:14:09.410">
      <executionStack>
        <frame procname="adhoc" sqlhandle="0x02">UPDATE dbo.inventory SET reserved = reserved + @qty WHERE sku_id = @sku;</frame>
      </executionStack>
      <inputbuf>BEGIN TRAN; UPDATE dbo.orders SET status = 'reserved' WHERE id = 91824; UPDATE dbo.inventory SET reserved = reserved + 2 WHERE sku_id = 4410;</inputbuf>
    </process>
    <process id="process202" spid="112" clientapp="fulfillment-sync" loginname="app_fulfillment" hostname="sync-01" isolationlevel="read committed (2)" waitresource="KEY: 6:72057594039894016 (44019a01b2c1)" waittime="1825" status="suspended" lastbatchstarted="2026-11-22T18:14:09.425">
      <executionStack>
        <frame procname="adhoc" sqlhandle="0x03">UPDATE dbo.orders SET shipped_at = SYSUTCDATETIME() WHERE id = @order_id;</frame>
      </executionStack>
      <inputbuf>BEGIN TRAN; UPDATE dbo.inventory SET on_hand = on_hand - 2 WHERE sku_id = 4410; UPDATE dbo.orders SET shipped_at = SYSUTCDATETIME() WHERE id = 91824;</inputbuf>
    </process>
  </process-list>
  <resource-list>
    <keylock hobtid="72057594039894016" dbid="6" objectname="shop.dbo.orders" indexname="PK_orders" id="lock_orders" mode="X">
      <owner-list><owner id="process201" mode="X"/></owner-list>
      <waiter-list><waiter id="process202" mode="U" requestType="wait"/></waiter-list>
    </keylock>
    <keylock hobtid="72057594041204736" dbid="6" objectname="shop.dbo.inventory" indexname="PK_inventory" id="lock_inventory" mode="X">
      <owner-list><owner id="process202" mode="X"/></owner-list>
      <waiter-list><waiter id="process201" mode="X" requestType="wait"/></waiter-list>
    </keylock>
  </resource-list>
</deadlock>`;

export async function getMssqlPlanDiffDemo(): Promise<{
  a: Plan;
  b: Plan;
  diff: PlanDiff;
  nameA: string;
  nameB: string;
  explainUrl: string;
}> {
  await ensureNodeWasm();
  const nameA = "Before (18.4K Key Lookups)";
  const nameB = "After covering INCLUDE index";
  const a = plans.parsePlan(MSSQL_BEFORE_KEY_LOOKUP_XML, "mssql");
  const b = plans.parsePlan(MSSQL_AFTER_COVERING_XML, "mssql");
  const diff = plans.diffPlans(a, nameA, b, nameB);
  const explainUrl = buildExplainShareUrl("compare", {
    v: 1,
    m: "compare",
    e: "mssql",
    na: nameA,
    pa: MSSQL_BEFORE_KEY_LOOKUP_XML,
    nb: nameB,
    pb: MSSQL_AFTER_COVERING_XML,
  });
  return { a, b, diff, nameA, nameB, explainUrl };
}

export async function getMssqlDeadlockDemo(): Promise<{
  deadlock: Deadlock;
  explainUrl: string;
}> {
  await ensureNodeWasm();
  const list = plans.parseDeadlock(MSSQL_DEADLOCK_XML);
  const explainUrl = buildExplainShareUrl("deadlock", {
    v: 1,
    m: "deadlock",
    t: "Checkout vs Fulfillment (.xdl)",
    d: MSSQL_DEADLOCK_XML,
  });
  return { deadlock: list[0]!, explainUrl };
}

const MSSQL_FAST_SEEK_PLAN_XML = `<ShowPlanXML xmlns="http://schemas.microsoft.com/sqlserver/2004/07/showplan" Version="1.564" Build="16.0.4295.3">
  <BatchSequence><Batch><Statements>
    <StmtSimple StatementText="SELECT TOP 100 i.id, i.amount_cents, i.issued_at, c.company_name FROM billing.invoices i JOIN billing.customers c ON c.id = i.customer_id WHERE i.tenant_id = @tenant_id AND i.state = 'open' ORDER BY i.issued_at DESC" StatementId="1" StatementCompId="1" StatementType="SELECT" StatementSubTreeCost="0.042" StatementEstRows="8" StatementOptmLevel="FULL" CardinalityEstimationModelVersion="160">
      <QueryPlan DegreeOfParallelism="1" CachedPlanSize="40" CompileTime="5" CompileCPU="5">
        <QueryTimeStats ElapsedTime="4" CpuTime="3"/>
        <RelOp NodeId="0" PhysicalOp="Top" LogicalOp="Top" EstimateRows="8" EstimateIO="0" EstimateCPU="0.00001" AvgRowSize="164" EstimatedTotalSubtreeCost="0.042" Parallel="0" EstimatedExecutionMode="Row">
          <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="8" ActualElapsedms="4" ActualCPUms="3" ActualExecutions="1" ActualExecutionMode="Row"/></RunTimeInformation>
          <Top RowCount="0" IsPercent="0" WithTies="0">
            <RelOp NodeId="1" PhysicalOp="Nested Loops" LogicalOp="Inner Join" EstimateRows="8" EstimateIO="0" EstimateCPU="0.0004" AvgRowSize="164" EstimatedTotalSubtreeCost="0.041" Parallel="0" EstimatedExecutionMode="Row">
              <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="8" ActualElapsedms="4" ActualCPUms="3" ActualExecutions="1" ActualExecutionMode="Row"/></RunTimeInformation>
              <NestedLoops Optimized="0">
                <RelOp NodeId="2" PhysicalOp="Index Seek" LogicalOp="Index Seek" EstimateRows="8" EstimatedRowsRead="8" EstimateIO="0.003125" EstimateCPU="0.000166" AvgRowSize="96" EstimatedTotalSubtreeCost="0.0033" TableCardinality="4800000" Parallel="0" EstimatedExecutionMode="Row">
                  <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="8" ActualElapsedms="1" ActualCPUms="1" ActualScans="1" ActualLogicalReads="4" ActualPhysicalReads="0" ActualExecutions="1" ActualExecutionMode="Row"/></RunTimeInformation>
                  <IndexScan Ordered="1" ScanDirection="BACKWARD" Storage="RowStore">
                    <Object Database="[billing_prod]" Schema="[billing]" Table="[invoices]" Index="[ix_invoices_tenant_state_issued]" Alias="[i]" IndexKind="NonClustered" Storage="RowStore"/>
                  </IndexScan>
                </RelOp>
                <RelOp NodeId="3" PhysicalOp="Clustered Index Seek" LogicalOp="Clustered Index Seek" EstimateRows="1" EstimateIO="0.003125" EstimateCPU="0.0001581" AvgRowSize="84" EstimatedTotalSubtreeCost="0.037" TableCardinality="310000" Parallel="0" EstimateRebinds="7" EstimatedExecutionMode="Row">
                  <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="8" ActualElapsedms="3" ActualCPUms="2" ActualLogicalReads="24" ActualPhysicalReads="0" ActualExecutions="8" ActualExecutionMode="Row"/></RunTimeInformation>
                  <IndexScan Ordered="1" ScanDirection="FORWARD" Storage="RowStore">
                    <Object Database="[billing_prod]" Schema="[billing]" Table="[customers]" Index="[pk_customers]" Alias="[c]" IndexKind="Clustered" Storage="RowStore"/>
                  </IndexScan>
                </RelOp>
              </NestedLoops>
            </RelOp>
          </Top>
        </RelOp>
        <ParameterList>
          <ColumnReference Column="@tenant_id" ParameterDataType="int" ParameterCompiledValue="(42)" ParameterRuntimeValue="(42)"/>
        </ParameterList>
      </QueryPlan>
    </StmtSimple>
  </Statements></Batch></BatchSequence>
</ShowPlanXML>`;

const MSSQL_REGRESSED_SCAN_SPILL_XML = `<ShowPlanXML xmlns="http://schemas.microsoft.com/sqlserver/2004/07/showplan" Version="1.564" Build="16.0.4295.3">
  <BatchSequence><Batch><Statements>
    <StmtSimple StatementText="SELECT TOP 100 i.id, i.amount_cents, i.issued_at, c.company_name FROM billing.invoices i JOIN billing.customers c ON c.id = i.customer_id WHERE i.tenant_id = @tenant_id AND i.state = 'open' ORDER BY i.issued_at DESC" StatementId="1" StatementCompId="1" StatementType="SELECT" StatementSubTreeCost="38.74" StatementEstRows="100" StatementOptmLevel="FULL" CardinalityEstimationModelVersion="160">
      <QueryPlan DegreeOfParallelism="1" MemoryGrant="2048" CachedPlanSize="72" CompileTime="19" CompileCPU="17">
        <QueryTimeStats ElapsedTime="412" CpuTime="298"/>
        <RelOp NodeId="0" PhysicalOp="Sort" LogicalOp="TopN Sort" EstimateRows="100" EstimateIO="0.011" EstimateCPU="0.28" AvgRowSize="164" EstimatedTotalSubtreeCost="38.74" Parallel="0" EstimatedExecutionMode="Row">
          <Warnings><SpillToTempDb SpillLevel="2" SpilledThreadCount="1"/></Warnings>
          <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="100" ActualElapsedms="412" ActualCPUms="298" ActualExecutions="1" ActualExecutionMode="Row"/></RunTimeInformation>
          <Sort Distinct="0">
            <RelOp NodeId="1" PhysicalOp="Hash Match" LogicalOp="Inner Join" EstimateRows="192000" EstimateIO="0" EstimateCPU="4.85" AvgRowSize="164" EstimatedTotalSubtreeCost="38.44" Parallel="0" EstimatedExecutionMode="Row">
              <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="192400" ActualElapsedms="348" ActualCPUms="251" ActualExecutions="1" ActualExecutionMode="Row"/></RunTimeInformation>
              <Hash>
                <RelOp NodeId="2" PhysicalOp="Clustered Index Scan" LogicalOp="Clustered Index Scan" EstimateRows="310000" EstimatedRowsRead="310000" EstimateIO="3.12" EstimateCPU="0.34" AvgRowSize="84" EstimatedTotalSubtreeCost="3.46" TableCardinality="310000" Parallel="0" EstimatedExecutionMode="Row">
                  <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="310000" ActualElapsedms="61" ActualCPUms="48" ActualScans="1" ActualLogicalReads="4210" ActualPhysicalReads="0" ActualExecutions="1" ActualExecutionMode="Row"/></RunTimeInformation>
                  <IndexScan Ordered="0" Storage="RowStore">
                    <Object Database="[billing_prod]" Schema="[billing]" Table="[customers]" Index="[pk_customers]" Alias="[c]" IndexKind="Clustered" Storage="RowStore"/>
                  </IndexScan>
                </RelOp>
                <RelOp NodeId="3" PhysicalOp="Clustered Index Scan" LogicalOp="Clustered Index Scan" EstimateRows="192000" EstimatedRowsRead="4800000" EstimateIO="24.80" EstimateCPU="5.33" AvgRowSize="96" EstimatedTotalSubtreeCost="30.13" TableCardinality="4800000" Parallel="0" EstimatedExecutionMode="Row">
                  <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="192400" ActualElapsedms="244" ActualCPUms="179" ActualScans="1" ActualLogicalReads="44690" ActualPhysicalReads="3120" ActualExecutions="1" ActualExecutionMode="Row"/></RunTimeInformation>
                  <IndexScan Ordered="0" Storage="RowStore">
                    <Object Database="[billing_prod]" Schema="[billing]" Table="[invoices]" Index="[pk_invoices]" Alias="[i]" IndexKind="Clustered" Storage="RowStore"/>
                  </IndexScan>
                </RelOp>
              </Hash>
            </RelOp>
          </Sort>
        </RelOp>
        <ParameterList>
          <ColumnReference Column="@tenant_id" ParameterDataType="int" ParameterCompiledValue="(9001)" ParameterRuntimeValue="(42)"/>
        </ParameterList>
      </QueryPlan>
    </StmtSimple>
  </Statements></Batch></BatchSequence>
</ShowPlanXML>`;

const MSSQL_IMPLICIT_CONVERSION_BEFORE_XML = `<ShowPlanXML xmlns="http://schemas.microsoft.com/sqlserver/2004/07/showplan" Version="1.564" Build="16.0.4295.3">
  <BatchSequence><Batch><Statements>
    <StmtSimple StatementText="SELECT id, customer_id, status, amount_cents FROM payments.charges WHERE external_ref = @p0" StatementId="1" StatementCompId="1" StatementType="SELECT" StatementSubTreeCost="8.94" StatementEstRows="1.4" StatementOptmLevel="FULL" CardinalityEstimationModelVersion="160">
      <QueryPlan DegreeOfParallelism="1" CachedPlanSize="24" CompileTime="3" CompileCPU="3">
        <Warnings>
          <PlanAffectingConvert ConvertIssue="Seek Plan" Expression="CONVERT_IMPLICIT(nvarchar(64),[payments].[charges].[external_ref],0)=[@p0]"/>
        </Warnings>
        <QueryTimeStats ElapsedTime="96" CpuTime="91"/>
        <RelOp NodeId="0" PhysicalOp="Index Scan" LogicalOp="Index Scan" EstimateRows="1.4" EstimatedRowsRead="1250000" EstimateIO="7.56" EstimateCPU="1.38" AvgRowSize="74" EstimatedTotalSubtreeCost="8.94" TableCardinality="1250000" Parallel="0" EstimatedExecutionMode="Row">
          <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualElapsedms="96" ActualCPUms="91" ActualScans="1" ActualLogicalReads="19420" ActualPhysicalReads="0" ActualExecutions="1" ActualExecutionMode="Row"/></RunTimeInformation>
          <IndexScan Ordered="0" Storage="RowStore">
            <Object Database="[pay_prod]" Schema="[payments]" Table="[charges]" Index="[ix_charges_external_ref]" Alias="[charges]" IndexKind="NonClustered" Storage="RowStore"/>
          </IndexScan>
        </RelOp>
        <ParameterList>
          <ColumnReference Column="@p0" ParameterDataType="nvarchar(64)" ParameterCompiledValue="(N'ch_3Q91kL82mN')"/>
        </ParameterList>
      </QueryPlan>
    </StmtSimple>
  </Statements></Batch></BatchSequence>
</ShowPlanXML>`;

const MSSQL_IMPLICIT_CONVERSION_AFTER_XML = `<ShowPlanXML xmlns="http://schemas.microsoft.com/sqlserver/2004/07/showplan" Version="1.564" Build="16.0.4295.3">
  <BatchSequence><Batch><Statements>
    <StmtSimple StatementText="SELECT id, customer_id, status, amount_cents FROM payments.charges WHERE external_ref = @p0" StatementId="1" StatementCompId="1" StatementType="SELECT" StatementSubTreeCost="0.0033" StatementEstRows="1" StatementOptmLevel="FULL" CardinalityEstimationModelVersion="160">
      <QueryPlan DegreeOfParallelism="1" CachedPlanSize="16" CompileTime="1" CompileCPU="1">
        <QueryTimeStats ElapsedTime="2" CpuTime="1"/>
        <RelOp NodeId="0" PhysicalOp="Index Seek" LogicalOp="Index Seek" EstimateRows="1" EstimatedRowsRead="1" EstimateIO="0.003125" EstimateCPU="0.0001581" AvgRowSize="74" EstimatedTotalSubtreeCost="0.0033" TableCardinality="1250000" Parallel="0" EstimatedExecutionMode="Row">
          <RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualElapsedms="2" ActualCPUms="1" ActualScans="1" ActualLogicalReads="4" ActualPhysicalReads="0" ActualExecutions="1" ActualExecutionMode="Row"/></RunTimeInformation>
          <IndexScan Ordered="1" ScanDirection="FORWARD" Storage="RowStore">
            <Object Database="[pay_prod]" Schema="[payments]" Table="[charges]" Index="[ix_charges_external_ref]" Alias="[charges]" IndexKind="NonClustered" Storage="RowStore"/>
          </IndexScan>
        </RelOp>
        <ParameterList>
          <ColumnReference Column="@p0" ParameterDataType="varchar(64)" ParameterCompiledValue="('ch_3Q91kL82mN')"/>
        </ParameterList>
      </QueryPlan>
    </StmtSimple>
  </Statements></Batch></BatchSequence>
</ShowPlanXML>`;

export async function getMssqlRegressionDiffDemo(): Promise<{
  a: Plan;
  b: Plan;
  diff: PlanDiff;
  nameA: string;
  nameB: string;
  explainUrl: string;
}> {
  await ensureNodeWasm();
  const nameA = "Baseline plan 68 (@tenant_id=42)";
  const nameB = "Regressed plan 69 (@tenant_id=9001)";
  const a = plans.parsePlan(MSSQL_FAST_SEEK_PLAN_XML, "mssql");
  const b = plans.parsePlan(MSSQL_REGRESSED_SCAN_SPILL_XML, "mssql");
  const diff = plans.diffPlans(a, nameA, b, nameB);
  const explainUrl = buildExplainShareUrl("compare", {
    v: 1,
    m: "compare",
    e: "mssql",
    na: nameA,
    pa: MSSQL_FAST_SEEK_PLAN_XML,
    nb: nameB,
    pb: MSSQL_REGRESSED_SCAN_SPILL_XML,
  });
  return { a, b, diff, nameA, nameB, explainUrl };
}

export async function getMssqlImplicitConversionDiffDemo(): Promise<{
  a: Plan;
  b: Plan;
  diff: PlanDiff;
  nameA: string;
  nameB: string;
  explainUrl: string;
}> {
  await ensureNodeWasm();
  const nameA = "nvarchar(64) param (19.4K page scan)";
  const nameB = "varchar(64) param (4-page seek)";
  const a = plans.parsePlan(MSSQL_IMPLICIT_CONVERSION_BEFORE_XML, "mssql");
  const b = plans.parsePlan(MSSQL_IMPLICIT_CONVERSION_AFTER_XML, "mssql");
  const diff = plans.diffPlans(a, nameA, b, nameB);
  const explainUrl = buildExplainShareUrl("compare", {
    v: 1,
    m: "compare",
    e: "mssql",
    na: nameA,
    pa: MSSQL_IMPLICIT_CONVERSION_BEFORE_XML,
    nb: nameB,
    pb: MSSQL_IMPLICIT_CONVERSION_AFTER_XML,
  });
  return { a, b, diff, nameA, nameB, explainUrl };
}

const MSSQL_ELASTIC_POOL_NOISY_SCAN_XML = `<ShowPlanXML xmlns="http://schemas.microsoft.com/sqlserver/2004/07/showplan" Version="1.564" Build="16.0.4295.3">
  <BatchSequence><Batch><Statements>
    <StmtSimple StatementText="SELECT workspace_id, route_group, COUNT_BIG(*) AS calls, SUM(duration_ms) AS total_ms FROM usage.daily_api_events WHERE billable = 1 AND bucket_date >= @since_date GROUP BY workspace_id, route_group" StatementId="1" StatementCompId="1" StatementType="SELECT" StatementSubTreeCost="94.60" StatementEstRows="1840" StatementOptmLevel="FULL" CardinalityEstimationModelVersion="160">
      <QueryPlan DegreeOfParallelism="4" MemoryGrant="16384" CachedPlanSize="88" CompileTime="16" CompileCPU="14">
        <MissingIndexes>
          <MissingIndexGroup Impact="96.8">
            <MissingIndex Database="[tenant_analytics]" Schema="[usage]" Table="[daily_api_events]">
              <ColumnGroup Usage="EQUALITY"><Column Name="[billable]" ColumnId="6"/></ColumnGroup>
              <ColumnGroup Usage="INEQUALITY"><Column Name="[bucket_date]" ColumnId="3"/></ColumnGroup>
              <ColumnGroup Usage="INCLUDE"><Column Name="[workspace_id]" ColumnId="2"/><Column Name="[route_group]" ColumnId="4"/><Column Name="[duration_ms]" ColumnId="7"/></ColumnGroup>
            </MissingIndex>
          </MissingIndexGroup>
        </MissingIndexes>
        <QueryTimeStats ElapsedTime="342" CpuTime="1180"/>
        <RelOp NodeId="0" PhysicalOp="Parallelism" LogicalOp="Gather Streams" EstimateRows="1840" EstimateIO="0" EstimateCPU="0.09" AvgRowSize="52" EstimatedTotalSubtreeCost="94.60" Parallel="1" EstimatedExecutionMode="Row">
          <RunTimeInformation>
            <RunTimeCountersPerThread Thread="0" ActualRows="312" ActualElapsedms="342" ActualCPUms="12" ActualExecutions="1" ActualExecutionMode="Row"/>
          </RunTimeInformation>
          <Parallelism>
            <RelOp NodeId="1" PhysicalOp="Hash Match" LogicalOp="Aggregate" EstimateRows="1840" EstimateIO="0" EstimateCPU="6.84" AvgRowSize="52" EstimatedTotalSubtreeCost="94.51" Parallel="1" EstimatedExecutionMode="Row">
              <RunTimeInformation>
                <RunTimeCountersPerThread Thread="1" ActualRows="82" ActualElapsedms="336" ActualCPUms="294" ActualExecutions="1" ActualExecutionMode="Row"/>
                <RunTimeCountersPerThread Thread="2" ActualRows="76" ActualElapsedms="338" ActualCPUms="298" ActualExecutions="1" ActualExecutionMode="Row"/>
                <RunTimeCountersPerThread Thread="3" ActualRows="79" ActualElapsedms="335" ActualCPUms="289" ActualExecutions="1" ActualExecutionMode="Row"/>
                <RunTimeCountersPerThread Thread="4" ActualRows="75" ActualElapsedms="337" ActualCPUms="287" ActualExecutions="1" ActualExecutionMode="Row"/>
              </RunTimeInformation>
              <Hash>
                <RelOp NodeId="2" PhysicalOp="Clustered Index Scan" LogicalOp="Clustered Index Scan" EstimateRows="485000" EstimatedRowsRead="8400000" EstimateIO="78.42" EstimateCPU="9.25" AvgRowSize="44" EstimatedTotalSubtreeCost="87.67" TableCardinality="8400000" Parallel="1" EstimatedExecutionMode="Row">
                  <RunTimeInformation>
                    <RunTimeCountersPerThread Thread="1" ActualRows="1120" ActualElapsedms="286" ActualCPUms="252" ActualScans="1" ActualLogicalReads="37120" ActualPhysicalReads="610" ActualExecutions="1" ActualExecutionMode="Row"/>
                    <RunTimeCountersPerThread Thread="2" ActualRows="1040" ActualElapsedms="289" ActualCPUms="256" ActualScans="1" ActualLogicalReads="36980" ActualPhysicalReads="590" ActualExecutions="1" ActualExecutionMode="Row"/>
                    <RunTimeCountersPerThread Thread="3" ActualRows="980" ActualElapsedms="284" ActualCPUms="248" ActualScans="1" ActualLogicalReads="37050" ActualPhysicalReads="605" ActualExecutions="1" ActualExecutionMode="Row"/>
                    <RunTimeCountersPerThread Thread="4" ActualRows="980" ActualElapsedms="285" ActualCPUms="249" ActualScans="1" ActualLogicalReads="37050" ActualPhysicalReads="585" ActualExecutions="1" ActualExecutionMode="Row"/>
                  </RunTimeInformation>
                  <IndexScan Ordered="0" Storage="RowStore">
                    <Object Database="[tenant_analytics]" Schema="[usage]" Table="[daily_api_events]" Index="[pk_daily_api_events]" IndexKind="Clustered" Storage="RowStore"/>
                  </IndexScan>
                </RelOp>
              </Hash>
            </RelOp>
          </Parallelism>
        </RelOp>
        <ParameterList>
          <ColumnReference Column="@since_date" ParameterDataType="date" ParameterCompiledValue="('2026-09-01')" ParameterRuntimeValue="('2026-11-26')"/>
        </ParameterList>
      </QueryPlan>
    </StmtSimple>
  </Statements></Batch></BatchSequence>
</ShowPlanXML>`;

const MSSQL_ELASTIC_POOL_INDEXED_SEEK_XML = `<ShowPlanXML xmlns="http://schemas.microsoft.com/sqlserver/2004/07/showplan" Version="1.564" Build="16.0.4295.3">
  <BatchSequence><Batch><Statements>
    <StmtSimple StatementText="SELECT workspace_id, route_group, COUNT_BIG(*) AS calls, SUM(duration_ms) AS total_ms FROM usage.daily_api_events WHERE billable = 1 AND bucket_date >= @since_date GROUP BY workspace_id, route_group" StatementId="1" StatementCompId="1" StatementType="SELECT" StatementSubTreeCost="0.068" StatementEstRows="312" StatementOptmLevel="FULL" CardinalityEstimationModelVersion="160">
      <QueryPlan DegreeOfParallelism="1" CachedPlanSize="32" CompileTime="4" CompileCPU="4">
        <QueryTimeStats ElapsedTime="6" CpuTime="6"/>
        <RelOp NodeId="0" PhysicalOp="Stream Aggregate" LogicalOp="Aggregate" EstimateRows="312" EstimateIO="0" EstimateCPU="0.0042" AvgRowSize="52" EstimatedTotalSubtreeCost="0.068" Parallel="0" EstimatedExecutionMode="Row">
          <RunTimeInformation>
            <RunTimeCountersPerThread Thread="0" ActualRows="312" ActualElapsedms="6" ActualCPUms="6" ActualExecutions="1" ActualExecutionMode="Row"/>
          </RunTimeInformation>
          <StreamAggregate>
            <RelOp NodeId="1" PhysicalOp="Index Seek" LogicalOp="Index Seek" EstimateRows="4120" EstimatedRowsRead="4120" EstimateIO="0.058" EstimateCPU="0.0058" AvgRowSize="44" EstimatedTotalSubtreeCost="0.0638" TableCardinality="8400000" Parallel="0" EstimatedExecutionMode="Row">
              <RunTimeInformation>
                <RunTimeCountersPerThread Thread="0" ActualRows="4120" ActualElapsedms="4" ActualCPUms="4" ActualScans="1" ActualLogicalReads="38" ActualPhysicalReads="0" ActualExecutions="1" ActualExecutionMode="Row"/>
              </RunTimeInformation>
              <IndexScan Ordered="1" ScanDirection="FORWARD" Storage="RowStore">
                <Object Database="[tenant_analytics]" Schema="[usage]" Table="[daily_api_events]" Index="[ix_daily_api_events_billable_bucket]" IndexKind="NonClustered" Storage="RowStore"/>
              </IndexScan>
            </RelOp>
          </StreamAggregate>
        </RelOp>
        <ParameterList>
          <ColumnReference Column="@since_date" ParameterDataType="date" ParameterCompiledValue="('2026-11-26')" ParameterRuntimeValue="('2026-11-26')"/>
        </ParameterList>
      </QueryPlan>
    </StmtSimple>
  </Statements></Batch></BatchSequence>
</ShowPlanXML>`;

export async function getMssqlElasticPoolDiffDemo(): Promise<{
  a: Plan;
  b: Plan;
  diff: PlanDiff;
  nameA: string;
  nameB: string;
  explainUrl: string;
}> {
  await ensureNodeWasm();
  const nameA = "DOP=4 pool scan";
  const nameB = "Covering index seek";
  const a = plans.parsePlan(MSSQL_ELASTIC_POOL_NOISY_SCAN_XML, "mssql");
  const b = plans.parsePlan(MSSQL_ELASTIC_POOL_INDEXED_SEEK_XML, "mssql");
  const diff = plans.diffPlans(a, nameA, b, nameB);
  const explainUrl = buildExplainShareUrl("compare", {
    v: 1,
    m: "compare",
    e: "mssql",
    na: nameA,
    pa: MSSQL_ELASTIC_POOL_NOISY_SCAN_XML,
    nb: nameB,
    pb: MSSQL_ELASTIC_POOL_INDEXED_SEEK_XML,
  });
  return { a, b, diff, nameA, nameB, explainUrl };
}

const MSSQL_WEBHOOK_DEADLOCK_XML = `<deadlock>
  <victim-list>
    <victimProcess id="process310"/>
  </victim-list>
  <process-list>
    <process id="process310" spid="88" clientapp="stripe-webhook-worker" loginname="app_billing" hostname="billing-pod-04" isolationlevel="read committed (2)" waitresource="KEY: 9:72057594058113024 (9c220a81e412)" waittime="2410" status="suspended" lastbatchstarted="2026-11-25T22:18:41.120">
      <executionStack>
        <frame procname="adhoc" sqlhandle="0x11">UPDATE billing.ledger_entries SET settled_at = SYSUTCDATETIME() WHERE subscription_id = @sub_id AND period_key = @period;</frame>
      </executionStack>
      <inputbuf>BEGIN TRAN; UPDATE billing.subscriptions SET status = 'active', updated_at = SYSUTCDATETIME() WHERE id = 50491; UPDATE billing.ledger_entries SET settled_at = SYSUTCDATETIME() WHERE subscription_id = 50491 AND period_key = '2026-11';</inputbuf>
    </process>
    <process id="process311" spid="134" clientapp="invoice-reconciler" loginname="app_reconciler" hostname="reconcile-cron-01" isolationlevel="repeatable read (3)" waitresource="KEY: 9:72057594056474624 (51e84029ab10)" waittime="2395" status="suspended" lastbatchstarted="2026-11-25T22:18:41.135">
      <executionStack>
        <frame procname="adhoc" sqlhandle="0x12">UPDATE billing.subscriptions SET balance_cents = balance_cents - @paid WHERE id = @sub_id;</frame>
      </executionStack>
      <inputbuf>BEGIN TRAN; UPDATE billing.ledger_entries SET reconciled = 1 WHERE subscription_id = 50491 AND period_key = '2026-11'; UPDATE billing.subscriptions SET balance_cents = balance_cents - 4900 WHERE id = 50491;</inputbuf>
    </process>
  </process-list>
  <resource-list>
    <keylock hobtid="72057594056474624" dbid="9" objectname="billing_prod.billing.subscriptions" indexname="PK_subscriptions" id="lock_subs" mode="X">
      <owner-list><owner id="process310" mode="X"/></owner-list>
      <waiter-list><waiter id="process311" mode="U" requestType="wait"/></waiter-list>
    </keylock>
    <keylock hobtid="72057594058113024" dbid="9" objectname="billing_prod.billing.ledger_entries" indexname="IX_ledger_sub_period" id="lock_ledger" mode="X">
      <owner-list><owner id="process311" mode="X"/></owner-list>
      <waiter-list><waiter id="process310" mode="U" requestType="wait"/></waiter-list>
    </keylock>
  </resource-list>
</deadlock>`;

export async function getMssqlWebhookDeadlockDemo(): Promise<{
  deadlock: Deadlock;
  explainUrl: string;
}> {
  await ensureNodeWasm();
  const list = plans.parseDeadlock(MSSQL_WEBHOOK_DEADLOCK_XML);
  const explainUrl = buildExplainShareUrl("deadlock", {
    v: 1,
    m: "deadlock",
    t: "Webhook Worker vs Invoice Reconciler (.xdl)",
    d: MSSQL_WEBHOOK_DEADLOCK_XML,
  });
  return { deadlock: list[0]!, explainUrl };
}

const PG_SEQ_SCAN_AUDIT_JSON = JSON.stringify([
  {
    Plan: {
      "Node Type": "Limit",
      "Startup Cost": 48210.4,
      "Total Cost": 48210.52,
      "Plan Rows": 50,
      "Plan Width": 168,
      "Actual Startup Time": 245.8,
      "Actual Total Time": 246.1,
      "Actual Rows": 50,
      "Actual Loops": 1,
      "Shared Hit Blocks": 32400,
      "Shared Read Blocks": 8800,
      Plans: [
        {
          "Node Type": "Sort",
          "Parent Relationship": "Outer",
          "Sort Key": ["created_at DESC"],
          "Sort Method": "top-N heapsort",
          "Sort Space Used": 42,
          "Sort Space Type": "Memory",
          "Startup Cost": 48210.4,
          "Total Cost": 48241.9,
          "Plan Rows": 12600,
          "Plan Width": 168,
          "Actual Startup Time": 245.7,
          "Actual Total Time": 246.0,
          "Actual Rows": 50,
          "Actual Loops": 1,
          "Shared Hit Blocks": 32400,
          "Shared Read Blocks": 8800,
          Plans: [
            {
              "Node Type": "Seq Scan",
              "Parent Relationship": "Outer",
              "Relation Name": "audit_events",
              Schema: "public",
              Alias: "audit_events",
              "Startup Cost": 0.0,
              "Total Cost": 47890.0,
              "Plan Rows": 12600,
              "Plan Width": 168,
              "Actual Startup Time": 0.04,
              "Actual Total Time": 238.4,
              "Actual Rows": 14200,
              "Actual Loops": 1,
              Filter: "((org_id = 481) AND ((action)::text = 'api_key.rotated'::text))",
              "Rows Removed by Filter": 2385800,
              "Shared Hit Blocks": 32400,
              "Shared Read Blocks": 8800,
            },
          ],
        },
      ],
    },
    "Planning Time": 0.28,
    "Execution Time": 246.2,
  },
]);

const PG_CONCURRENT_INDEX_AUDIT_JSON = JSON.stringify([
  {
    Plan: {
      "Node Type": "Limit",
      "Startup Cost": 0.43,
      "Total Cost": 4.88,
      "Plan Rows": 50,
      "Plan Width": 168,
      "Actual Startup Time": 0.05,
      "Actual Total Time": 1.38,
      "Actual Rows": 50,
      "Actual Loops": 1,
      "Shared Hit Blocks": 6,
      "Shared Read Blocks": 0,
      Plans: [
        {
          "Node Type": "Index Scan",
          "Parent Relationship": "Outer",
          "Scan Direction": "Backward",
          "Index Name": "audit_events_org_action_created_idx",
          "Relation Name": "audit_events",
          Schema: "public",
          Alias: "audit_events",
          "Startup Cost": 0.43,
          "Total Cost": 112.4,
          "Plan Rows": 1260,
          "Plan Width": 168,
          "Actual Startup Time": 0.05,
          "Actual Total Time": 1.34,
          "Actual Rows": 50,
          "Actual Loops": 1,
          "Index Cond": "((org_id = 481) AND ((action)::text = 'api_key.rotated'::text))",
          "Shared Hit Blocks": 6,
          "Shared Read Blocks": 0,
        },
      ],
    },
    "Planning Time": 0.14,
    "Execution Time": 1.42,
  },
]);

export async function getPostgresMcpPlanDiffDemo(): Promise<{
  a: Plan;
  b: Plan;
  diff: PlanDiff;
  nameA: string;
  nameB: string;
  explainUrl: string;
}> {
  await ensureNodeWasm();
  const nameA = "Seq Scan (2.4M rows)";
  const nameB = "CONCURRENTLY index";
  const a = plans.parsePlan(PG_SEQ_SCAN_AUDIT_JSON, "postgres");
  const b = plans.parsePlan(PG_CONCURRENT_INDEX_AUDIT_JSON, "postgres");
  const diff = plans.diffPlans(a, nameA, b, nameB);
  const explainUrl = buildExplainShareUrl("compare", {
    v: 1,
    m: "compare",
    e: "postgres",
    na: nameA,
    pa: PG_SEQ_SCAN_AUDIT_JSON,
    nb: nameB,
    pb: PG_CONCURRENT_INDEX_AUDIT_JSON,
  });
  return { a, b, diff, nameA, nameB, explainUrl };
}

const PG_SUBTRANS_HEAP_BEFORE_JSON = JSON.stringify([
  {
    Plan: {
      "Node Type": "Limit",
      "Startup Cost": 1480.2,
      "Total Cost": 1480.33,
      "Plan Rows": 50,
      "Plan Width": 92,
      "Actual Startup Time": 384.2,
      "Actual Total Time": 384.6,
      "Actual Rows": 50,
      "Actual Loops": 1,
      "Shared Hit Blocks": 31200,
      "Shared Read Blocks": 7200,
      Plans: [
        {
          "Node Type": "Sort",
          "Parent Relationship": "Outer",
          "Sort Key": ["attempted_at DESC"],
          "Sort Method": "top-N heapsort",
          "Sort Space Used": 38,
          "Sort Space Type": "Memory",
          "Startup Cost": 1480.2,
          "Total Cost": 1528.7,
          "Plan Rows": 19400,
          "Plan Width": 92,
          "Actual Startup Time": 384.1,
          "Actual Total Time": 384.5,
          "Actual Rows": 50,
          "Actual Loops": 1,
          "Shared Hit Blocks": 31200,
          "Shared Read Blocks": 7200,
          Plans: [
            {
              "Node Type": "Index Only Scan",
              "Parent Relationship": "Outer",
              "Scan Direction": "Backward",
              "Index Name": "payment_attempts_merchant_state_attempted_idx",
              "Relation Name": "payment_attempts",
              Schema: "public",
              Alias: "payment_attempts",
              "Startup Cost": 0.56,
              "Total Cost": 836.4,
              "Plan Rows": 19400,
              "Plan Width": 92,
              "Actual Startup Time": 0.42,
              "Actual Total Time": 376.8,
              "Actual Rows": 19420,
              "Actual Loops": 1,
              "Index Cond": "((merchant_id = 9042) AND (state = 'pending'::text))",
              "Heap Fetches": 38400,
              "Shared Hit Blocks": 31200,
              "Shared Read Blocks": 7200,
            },
          ],
        },
      ],
    },
    "Planning Time": 0.24,
    "Execution Time": 384.8,
  },
]);

const PG_SUBTRANS_CLEAN_AFTER_JSON = JSON.stringify([
  {
    Plan: {
      "Node Type": "Limit",
      "Startup Cost": 0.56,
      "Total Cost": 3.92,
      "Plan Rows": 50,
      "Plan Width": 92,
      "Actual Startup Time": 0.06,
      "Actual Total Time": 1.78,
      "Actual Rows": 50,
      "Actual Loops": 1,
      "Shared Hit Blocks": 8,
      "Shared Read Blocks": 0,
      Plans: [
        {
          "Node Type": "Index Only Scan",
          "Parent Relationship": "Outer",
          "Scan Direction": "Backward",
          "Index Name": "payment_attempts_merchant_state_attempted_idx",
          "Relation Name": "payment_attempts",
          Schema: "public",
          Alias: "payment_attempts",
          "Startup Cost": 0.56,
          "Total Cost": 1304.2,
          "Plan Rows": 19400,
          "Plan Width": 92,
          "Actual Startup Time": 0.05,
          "Actual Total Time": 1.72,
          "Actual Rows": 50,
          "Actual Loops": 1,
          "Index Cond": "((merchant_id = 9042) AND (state = 'pending'::text))",
          "Heap Fetches": 0,
          "Shared Hit Blocks": 8,
          "Shared Read Blocks": 0,
        },
      ],
    },
    "Planning Time": 0.16,
    "Execution Time": 1.84,
  },
]);

export async function getPostgresSubtransDiffDemo(): Promise<{
  a: Plan;
  b: Plan;
  diff: PlanDiff;
  nameA: string;
  nameB: string;
  explainUrl: string;
}> {
  await ensureNodeWasm();
  const nameA = "Savepoint loop + 38.4K Heap Fetches";
  const nameB = "ON CONFLICT + all-visible VM";
  const a = plans.parsePlan(PG_SUBTRANS_HEAP_BEFORE_JSON, "postgres");
  const b = plans.parsePlan(PG_SUBTRANS_CLEAN_AFTER_JSON, "postgres");
  const diff = plans.diffPlans(a, nameA, b, nameB);
  const explainUrl = buildExplainShareUrl("compare", {
    v: 1,
    m: "compare",
    e: "postgres",
    na: nameA,
    pa: PG_SUBTRANS_HEAP_BEFORE_JSON,
    nb: nameB,
    pb: PG_SUBTRANS_CLEAN_AFTER_JSON,
  });
  return { a, b, diff, nameA, nameB, explainUrl };
}

const PG_FK_SEQ_SCAN_BEFORE_JSON = JSON.stringify([
  {
    Plan: {
      "Node Type": "ModifyTable",
      Operation: "Delete",
      "Parallel Aware": false,
      "Relation Name": "webhook_deliveries",
      Schema: "public",
      Alias: "webhook_deliveries",
      "Startup Cost": 0.0,
      "Total Cost": 96420.0,
      "Plan Rows": 12,
      "Plan Width": 6,
      "Actual Startup Time": 612.1,
      "Actual Total Time": 612.3,
      "Actual Rows": 0,
      "Actual Loops": 1,
      "Shared Hit Blocks": 18412,
      "Shared Read Blocks": 42600,
      Plans: [
        {
          "Node Type": "Seq Scan",
          "Parent Relationship": "Outer",
          "Parallel Aware": false,
          "Relation Name": "webhook_deliveries",
          Schema: "public",
          Alias: "webhook_deliveries",
          "Startup Cost": 0.0,
          "Total Cost": 96420.0,
          "Plan Rows": 12,
          "Plan Width": 6,
          "Actual Startup Time": 14.8,
          "Actual Total Time": 611.9,
          "Actual Rows": 12,
          "Actual Loops": 1,
          Filter: "(workspace_id = 71904)",
          "Rows Removed by Filter": 3799988,
          "Shared Hit Blocks": 18400,
          "Shared Read Blocks": 42600,
        },
      ],
    },
    "Planning Time": 0.31,
    "Execution Time": 612.4,
  },
]);

const PG_FK_INDEX_SCAN_AFTER_JSON = JSON.stringify([
  {
    Plan: {
      "Node Type": "ModifyTable",
      Operation: "Delete",
      "Parallel Aware": false,
      "Relation Name": "webhook_deliveries",
      Schema: "public",
      Alias: "webhook_deliveries",
      "Startup Cost": 0.43,
      "Total Cost": 14.82,
      "Plan Rows": 12,
      "Plan Width": 6,
      "Actual Startup Time": 0.44,
      "Actual Total Time": 0.46,
      "Actual Rows": 0,
      "Actual Loops": 1,
      "Shared Hit Blocks": 17,
      "Shared Read Blocks": 0,
      Plans: [
        {
          "Node Type": "Index Scan",
          "Parent Relationship": "Outer",
          "Parallel Aware": false,
          "Scan Direction": "Forward",
          "Index Name": "webhook_deliveries_workspace_id_idx",
          "Relation Name": "webhook_deliveries",
          Schema: "public",
          Alias: "webhook_deliveries",
          "Startup Cost": 0.43,
          "Total Cost": 14.82,
          "Plan Rows": 12,
          "Plan Width": 6,
          "Actual Startup Time": 0.06,
          "Actual Total Time": 0.21,
          "Actual Rows": 12,
          "Actual Loops": 1,
          "Index Cond": "(workspace_id = 71904)",
          "Shared Hit Blocks": 5,
          "Shared Read Blocks": 0,
        },
      ],
    },
    "Planning Time": 0.19,
    "Execution Time": 0.48,
  },
]);

export async function getPostgresFkCascadeDiffDemo(): Promise<{
  a: Plan;
  b: Plan;
  diff: PlanDiff;
  nameA: string;
  nameB: string;
  explainUrl: string;
}> {
  await ensureNodeWasm();
  const nameA = "Unindexed FK cascade (3.8M Seq Scan)";
  const nameB = "With CONCURRENTLY FK index";
  const a = plans.parsePlan(PG_FK_SEQ_SCAN_BEFORE_JSON, "postgres");
  const b = plans.parsePlan(PG_FK_INDEX_SCAN_AFTER_JSON, "postgres");
  const diff = plans.diffPlans(a, nameA, b, nameB);
  const explainUrl = buildExplainShareUrl("compare", {
    v: 1,
    m: "compare",
    e: "postgres",
    na: nameA,
    pa: PG_FK_SEQ_SCAN_BEFORE_JSON,
    nb: nameB,
    pb: PG_FK_INDEX_SCAN_AFTER_JSON,
  });
  return { a, b, diff, nameA, nameB, explainUrl };
}
