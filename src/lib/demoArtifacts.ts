import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as plans from "@culpritsql/plans";
import type { Deadlock, Plan, PlanDiff } from "@culpritsql/plan-viewer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
}> {
  await ensureNodeWasm();
  const nameA = "Before (18.4K Key Lookups)";
  const nameB = "After covering INCLUDE index";
  const a = plans.parsePlan(MSSQL_BEFORE_KEY_LOOKUP_XML, "mssql");
  const b = plans.parsePlan(MSSQL_AFTER_COVERING_XML, "mssql");
  const diff = plans.diffPlans(a, nameA, b, nameB);
  return { a, b, diff, nameA, nameB };
}

export async function getMssqlDeadlockDemo(): Promise<Deadlock> {
  await ensureNodeWasm();
  const list = plans.parseDeadlock(MSSQL_DEADLOCK_XML);
  return list[0]!;
}
