"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { createPaymentReceipt, createSupplierPayment, deletePaymentReceipt, deleteSupplierPayment, updatePaymentReceipt, updateSupplierPayment } from "@/app/(dashboard)/finance/actions";
import { Badge } from "@/components/ui/badge";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { FormSection } from "@/components/ui/form-section";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { SectionCard } from "@/components/ui/section-card";
import { SlideOver } from "@/components/ui/slide-over";
import { StatStrip } from "@/components/ui/stat-strip";
import type {
  FinanceCustomerStatementRecord,
  FinanceReceivableRecord,
  OrderCreateOption,
  PaymentReceiptRecord,
  SupplierPaymentRecord,
} from "@/lib/loaders/admin";

type FinanceOperationsWorkbenchProps = {
  statements: FinanceCustomerStatementRecord[];
  receivables: FinanceReceivableRecord[];
  receipts: PaymentReceiptRecord[];
  supplierPayments: SupplierPaymentRecord[];
  orderOptions: OrderCreateOption[];
  canWriteFinance: boolean;
};

const receivableFilters = ["全部", "未回款", "部分回款", "已回款"];

export function FinanceOperationsWorkbench({
  statements,
  receivables,
  receipts,
  supplierPayments,
  orderOptions,
  canWriteFinance,
}: FinanceOperationsWorkbenchProps) {
  const [query, setQuery] = useState("");
  const [receivableFilter, setReceivableFilter] = useState("全部");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(statements[0]?.customerId ?? null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(receipts[0]?.id ?? null);
  const [selectedSupplierPaymentId, setSelectedSupplierPaymentId] = useState<string | null>(supplierPayments[0]?.id ?? null);
  const [receiptDrawerOpen, setReceiptDrawerOpen] = useState(false);
  const [supplierPaymentDrawerOpen, setSupplierPaymentDrawerOpen] = useState(false);
  const [createReceiptDialogOpen, setCreateReceiptDialogOpen] = useState(false);
  const [createSupplierPaymentDialogOpen, setCreateSupplierPaymentDialogOpen] = useState(false);

  const filteredStatements = useMemo(() => {
    return statements.filter((statement) => {
      const haystack = statement.customerName.toLowerCase();
      return !query.trim() || haystack.includes(query.trim().toLowerCase());
    });
  }, [query, statements]);

  useEffect(() => {
    if (!filteredStatements.length) {
      setSelectedCustomerId(null);
      return;
    }

    if (!selectedCustomerId || !filteredStatements.some((statement) => statement.customerId === selectedCustomerId)) {
      setSelectedCustomerId(filteredStatements[0].customerId);
    }
  }, [filteredStatements, selectedCustomerId]);

  const selectedStatement = filteredStatements.find((item) => item.customerId === selectedCustomerId) ?? filteredStatements[0] ?? null;
  const statementRowIndex = selectedStatement
    ? filteredStatements.findIndex((item) => item.customerId === selectedStatement.customerId)
    : undefined;

  const customerReceivables = useMemo(() => {
    return receivables.filter((item) => {
      const matchesCustomer = !selectedStatement || item.customerId === selectedStatement.customerId;
      const matchesFilter = receivableFilter === "全部" || item.statusLabel === receivableFilter;
      return matchesCustomer && matchesFilter;
    });
  }, [receivableFilter, receivables, selectedStatement]);

  const customerReceipts = useMemo(() => {
    return receipts.filter((item) => !selectedStatement || item.customerId === selectedStatement.customerId);
  }, [receipts, selectedStatement]);

  useEffect(() => {
    if (!customerReceipts.length) {
      setSelectedReceiptId(null);
      return;
    }

    if (!selectedReceiptId || !customerReceipts.some((item) => item.id === selectedReceiptId)) {
      setSelectedReceiptId(customerReceipts[0].id);
    }
  }, [customerReceipts, selectedReceiptId]);

  useEffect(() => {
    if (!supplierPayments.length) {
      setSelectedSupplierPaymentId(null);
      return;
    }

    if (!selectedSupplierPaymentId || !supplierPayments.some((item) => item.id === selectedSupplierPaymentId)) {
      setSelectedSupplierPaymentId(supplierPayments[0].id);
    }
  }, [selectedSupplierPaymentId, supplierPayments]);

  const selectedReceipt = customerReceipts.find((item) => item.id === selectedReceiptId) ?? customerReceipts[0] ?? null;
  const receiptRowIndex = selectedReceipt ? customerReceipts.findIndex((item) => item.id === selectedReceipt.id) : undefined;
  const selectedSupplierPayment = supplierPayments.find((item) => item.id === selectedSupplierPaymentId) ?? supplierPayments[0] ?? null;
  const supplierPaymentRowIndex = selectedSupplierPayment
    ? supplierPayments.findIndex((item) => item.id === selectedSupplierPayment.id)
    : undefined;

  useEffect(() => {
    if (!selectedReceipt) {
      setReceiptDrawerOpen(false);
    }
  }, [selectedReceipt]);

  useEffect(() => {
    if (!selectedSupplierPayment) {
      setSupplierPaymentDrawerOpen(false);
    }
  }, [selectedSupplierPayment]);

  const createReceiptForm = (
    <form action={createPaymentReceipt} className="grid gap-4">
      <div className="rounded-[1.5rem] border border-cyan-200/80 bg-[linear-gradient(135deg,rgba(236,254,255,0.95),rgba(248,250,252,0.92))] px-4 py-4">
        <StatStrip
          items={[
            { label: "录入目标", value: "订单回款", accent: "text-cyan-700" },
            { label: "同步影响", value: "应收余额 / 对账摘要", accent: "text-cyan-700" },
            { label: "记录范围", value: "到账 / 对账 / 流水号", accent: "text-cyan-700" },
          ]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <FormSection title="回款主体信息" description="先确认这笔钱对应哪张订单，以及到账日期和金额。">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">订单</label>
              <select
                name="orderId"
                disabled={!canWriteFinance}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">选择订单</option>
                {orderOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}{option.hint ? ` · ${option.hint}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">到账日期</label>
                <input
                  type="date"
                  name="receivedOn"
                  disabled={!canWriteFinance}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">金额 JPY</label>
                <input
                  type="number"
                  min="1"
                  step="1000"
                  name="amountJpy"
                  disabled={!canWriteFinance}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="回款状态与方式" description="把回款方式、当前状态和流水号统一记下来，方便后续对账和追溯。">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">回款方式</label>
                <select
                  name="method"
                  defaultValue="bank_transfer"
                  disabled={!canWriteFinance}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="bank_transfer">银行转账</option>
                  <option value="cash">现金</option>
                  <option value="credit_card">信用卡</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">状态</label>
                <select
                  name="status"
                  defaultValue="received"
                  disabled={!canWriteFinance}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="pending">待到账</option>
                  <option value="received">已到账</option>
                  <option value="reconciled">已对账</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">流水号 / 备注编号</label>
              <input
                type="text"
                name="referenceNo"
                disabled={!canWriteFinance}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>
        </FormSection>
      </div>

      <FormSection title="补充备注" description="记录特殊到账说明、分批回款背景或和客户确认过的对账口径。">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">备注</label>
          <textarea
            name="notes"
            rows={3}
            disabled={!canWriteFinance}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </FormSection>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {canWriteFinance ? "登记后会同步刷新客户应收、订单未回款和对账摘要。" : "当前账号只能查看回款与对账数据。"}
        </p>
        <PendingSubmitButton
          disabled={!canWriteFinance}
          pendingLabel="正在登记回款..."
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          登记回款
        </PendingSubmitButton>
      </div>
    </form>
  );

  const createSupplierPaymentForm = (
    <form action={createSupplierPayment} className="grid gap-4">
      <div className="rounded-[1.5rem] border border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,251,235,0.95),rgba(248,250,252,0.9))] px-4 py-4">
        <StatStrip
          items={[
            { label: "录入目标", value: "供应商付款", accent: "text-amber-700" },
            { label: "同步影响", value: "本月已付款 / 净现金流", accent: "text-amber-700" },
            { label: "记录范围", value: "供应商 / 类别 / 流水号", accent: "text-amber-700" },
          ]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <FormSection title="付款主体信息" description="先确认对应订单、供应商、类别和金额。">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">订单</label>
                <select
                  name="orderId"
                  disabled={!canWriteFinance}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">选择订单</option>
                  {orderOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}{option.hint ? ` · ${option.hint}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">供应商名称</label>
                <input
                  type="text"
                  name="supplierName"
                  disabled={!canWriteFinance}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">类别</label>
                <select
                  name="category"
                  defaultValue="vehicle"
                  disabled={!canWriteFinance}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="vehicle">车辆</option>
                  <option value="driver">司机</option>
                  <option value="guide">导游</option>
                  <option value="hotel">酒店</option>
                  <option value="meal">餐食</option>
                  <option value="ticket">门票</option>
                  <option value="misc">杂费</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">付款日期</label>
                <input
                  type="date"
                  name="paidOn"
                  disabled={!canWriteFinance}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">金额 JPY</label>
                <input
                  type="number"
                  min="1"
                  step="1000"
                  name="amountJpy"
                  disabled={!canWriteFinance}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="付款方式与追溯信息" description="记录付款方式、状态、流水号和备注，方便月底对账和现金流追踪。">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">付款方式</label>
                <select
                  name="method"
                  defaultValue="bank_transfer"
                  disabled={!canWriteFinance}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="bank_transfer">银行转账</option>
                  <option value="cash">现金</option>
                  <option value="credit_card">信用卡</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">状态</label>
                <select
                  name="status"
                  defaultValue="paid"
                  disabled={!canWriteFinance}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="pending">待付款</option>
                  <option value="paid">已付款</option>
                  <option value="reconciled">已对账</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">流水号 / 备注编号</label>
                <input
                  type="text"
                  name="referenceNo"
                  disabled={!canWriteFinance}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">备注</label>
              <textarea
                name="notes"
                rows={3}
                disabled={!canWriteFinance}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>
        </FormSection>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {canWriteFinance ? "登记后会同步刷新本月已付款和净现金流摘要。" : "当前账号只能查看付款台账。"}
        </p>
        <PendingSubmitButton
          disabled={!canWriteFinance}
          pendingLabel="正在登记付款..."
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          登记付款
        </PendingSubmitButton>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-700">Quick Create</p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">登记客户回款</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">把回款登记收进弹层后，财务首页可以先专注查看应收、对账和当前流水。</p>
            </div>
            <button
              type="button"
              onClick={() => setCreateReceiptDialogOpen(true)}
              disabled={!canWriteFinance}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#115e59)] px-5 text-sm font-medium text-white shadow-lg shadow-cyan-950/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-950/15 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              新增回款
            </button>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-amber-700">Quick Create</p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">登记供应商付款</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">把供应商付款也切到弹层后，财务工作台第一屏会更像现金流中控，而不是录入页面。</p>
            </div>
            <button
              type="button"
              onClick={() => setCreateSupplierPaymentDialogOpen(true)}
              disabled={!canWriteFinance}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#78350f,#92400e)] px-5 text-sm font-medium text-white shadow-lg shadow-amber-950/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-950/15 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              新增付款
            </button>
          </div>
        </div>
      </section>

      <Dialog
        open={createReceiptDialogOpen}
        onClose={() => setCreateReceiptDialogOpen(false)}
        title="回款登记工作台"
        description="在弹层里完成回款录入，不打断当前应收和对账视角。"
        eyebrow="Create Receipt"
        maxWidthClassName="max-w-6xl"
      >
        {createReceiptForm}
      </Dialog>

      <Dialog
        open={createSupplierPaymentDialogOpen}
        onClose={() => setCreateSupplierPaymentDialogOpen(false)}
        title="供应商付款登记工作台"
        description="在弹层里完成供应商付款登记，不打断当前付款台账和现金流视角。"
        eyebrow="Create Supplier Payment"
        maxWidthClassName="max-w-6xl"
      >
        {createSupplierPaymentForm}
      </Dialog>

      <section className="grid gap-4 2xl:grid-cols-[0.92fr_1.08fr]">
        <SectionCard title="客户对账摘要" description="按客户查看累计营收、已回款、未回款和最近一次回款日期。">
          <div className="space-y-4">
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索客户名称"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <DataTable
              columns={["客户", "订单数", "待对账", "已回款", "未回款", "最近回款"]}
              rows={filteredStatements.map((item) => ({
                customer: item.customerName,
                orders: `${item.orderCount} 单`,
                pending: `${item.outstandingOrders} 单`,
                received: item.totalReceivedLabel,
                outstanding: item.totalOutstandingLabel,
                latest: item.lastReceiptDateLabel,
              }))}
              selectedRowIndex={statementRowIndex}
              onRowClick={(_, rowIndex) => setSelectedCustomerId(filteredStatements[rowIndex]?.customerId ?? null)}
              emptyMessage="当前没有客户对账数据。"
            />
          </div>
        </SectionCard>

        <SectionCard title="客户应收与回款明细" description="左边看该客户的订单应收，右边看已登记的回款流水与状态。">
          {selectedStatement ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected Customer</p>
                <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedStatement.customerName}</p>
                <Link href={`/customers/${selectedStatement.customerId}`} className="mt-3 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700">
                  打开客户档案
                </Link>
                <div className="mt-3">
                  <StatStrip
                    items={[
                      { label: "累计营收", value: selectedStatement.totalRevenueLabel },
                      { label: "已回款", value: selectedStatement.totalReceivedLabel },
                      { label: "未回款", value: selectedStatement.totalOutstandingLabel },
                    ]}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {receivableFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setReceivableFilter(filter)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      receivableFilter === filter
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <DataTable
                columns={["订单号", "服务日期", "营收", "已回款", "未回款", "账龄", "状态"]}
                rows={customerReceivables.map((item) => ({
                  orderNo: item.orderNo,
                  date: item.serviceDateLabel,
                  revenue: item.revenueLabel,
                  received: item.receivedLabel,
                  outstanding: item.outstandingLabel,
                  aging: item.agingLabel,
                  status: item.statusLabel,
                }))}
                emptyMessage="当前筛选下没有应收订单。"
              />

              <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">回款流水</p>
                    <Badge label={`${customerReceipts.length} 条`} tone={customerReceipts.length ? "info" : "neutral"} />
                  </div>
                  <DataTable
                    columns={["到账日", "订单号", "金额", "方式", "状态"]}
                    rows={customerReceipts.map((item) => ({
                      date: item.receivedOnLabel,
                      orderNo: item.orderNo,
                      amount: item.amountLabel,
                      method: item.methodLabel,
                      status: item.statusLabel,
                    }))}
                    selectedRowIndex={receiptRowIndex}
                    onRowClick={(_, rowIndex) => setSelectedReceiptId(customerReceipts[rowIndex]?.id ?? null)}
                    emptyMessage="当前客户还没有回款流水。"
                  />
                </div>

                <div>
                  {selectedReceipt ? (
                    <div className="space-y-3">
                    <form action={updatePaymentReceipt} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <input type="hidden" name="receiptId" value={selectedReceipt.id} />

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected Receipt</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">{selectedReceipt.orderNo}</p>
                            <p className="mt-1 text-sm text-slate-600">{selectedReceipt.customerName} · {selectedReceipt.amountLabel}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReceiptDrawerOpen(true)}
                            className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                          >
                            打开侧边详情
                          </button>
                        </div>
                      </div>
                      <FormSection title="回款主体信息" description="先确认这笔回款对应哪张订单，以及到账日期和金额是否准确。">
                        <div className="space-y-4">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">订单</label>
                            <select
                              name="orderId"
                              defaultValue={selectedReceipt.orderId}
                              disabled={!canWriteFinance}
                              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {orderOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}{option.hint ? ` · ${option.hint}` : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">到账日期</label>
                              <input
                                type="date"
                                name="receivedOn"
                                defaultValue={selectedReceipt.receivedOn}
                                disabled={!canWriteFinance}
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">金额 JPY</label>
                              <input
                                type="number"
                                min="1"
                                step="1000"
                                name="amountJpy"
                                defaultValue={selectedReceipt.amountJpy}
                                disabled={!canWriteFinance}
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                              />
                            </div>
                          </div>
                        </div>
                      </FormSection>

                      <FormSection title="状态与追溯信息" description="把回款方式、当前状态、流水号和备注统一补齐，方便月底对账。">
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">回款方式</label>
                              <select
                                name="method"
                                defaultValue={selectedReceipt.method}
                                disabled={!canWriteFinance}
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <option value="bank_transfer">银行转账</option>
                                <option value="cash">现金</option>
                                <option value="credit_card">信用卡</option>
                                <option value="other">其他</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">状态</label>
                              <select
                                name="status"
                                defaultValue={selectedReceipt.status}
                                disabled={!canWriteFinance}
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <option value="pending">待到账</option>
                                <option value="received">已到账</option>
                                <option value="reconciled">已对账</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">流水号 / 备注编号</label>
                            <input
                              type="text"
                              name="referenceNo"
                              defaultValue={selectedReceipt.referenceNo}
                              disabled={!canWriteFinance}
                              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">备注</label>
                            <textarea
                              name="notes"
                              rows={4}
                              defaultValue={selectedReceipt.notes}
                              disabled={!canWriteFinance}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                            />
                          </div>
                        </div>
                      </FormSection>

                      <PendingSubmitButton
                        disabled={!canWriteFinance}
                        pendingLabel="正在保存回款..."
                        className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        保存回款记录
                      </PendingSubmitButton>
                    </form>
                    <form id={`delete-receipt-${selectedReceipt.id}`} action={deletePaymentReceipt}>
                      <input type="hidden" name="receiptId" value={selectedReceipt.id} />
                    </form>
                    <div className="flex justify-end">
                      <ConfirmActionButton formId={`delete-receipt-${selectedReceipt.id}`} title="确认删除这条回款记录？" description="删除后应收余额会重新计算，请仅用于修正错误流水。" confirmLabel="确认删除" disabled={!canWriteFinance}>删除错误回款</ConfirmActionButton>
                    </div>
                    </div>
                  ) : (
                    <EmptyStateCard title="还没有回款流水" description="先在上方登记第一笔回款，这里就会开始显示到账状态、方式和备注。" />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyStateCard title="还没有客户对账数据" description="一旦客户和订单进入真实业务流，这里会自动形成对账摘要、应收账龄和回款明细。" />
          )}
        </SectionCard>
      </section>

      <SectionCard
        title="供应商付款台账"
        description="把车辆、司机、导游、酒店和其他供应商付款统一登记，和回款一起看净现金流。"
        action={<Badge label={`${supplierPayments.length} 条付款`} tone={supplierPayments.length ? "info" : "neutral"} />}
      >
        <div className="space-y-4">
          <DataTable
            columns={["付款日", "订单号", "供应商", "类别", "金额", "状态"]}
            rows={supplierPayments.map((item) => ({
              date: item.paidOnLabel,
              orderNo: item.orderNo,
              supplier: item.supplierName,
              category: item.categoryLabel,
              amount: item.amountLabel,
              status: item.statusLabel,
            }))}
            selectedRowIndex={supplierPaymentRowIndex}
            onRowClick={(_, rowIndex) => setSelectedSupplierPaymentId(supplierPayments[rowIndex]?.id ?? null)}
            emptyMessage="当前还没有供应商付款记录。"
          />

          {selectedSupplierPayment ? (
            <div className="space-y-3">
            <form action={updateSupplierPayment} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <input type="hidden" name="paymentId" value={selectedSupplierPayment.id} />
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected Payment</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{selectedSupplierPayment.supplierName}</p>
                    <p className="mt-1 text-sm text-slate-600">{selectedSupplierPayment.orderNo} · {selectedSupplierPayment.amountLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSupplierPaymentDrawerOpen(true)}
                    className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                  >
                    打开侧边详情
                  </button>
                </div>
              </div>
              <FormSection title="付款主体信息" description="先确认订单、供应商、类别、付款日期和金额，避免月底对账时回溯困难。">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">订单</label>
                      <select
                        name="orderId"
                        defaultValue={selectedSupplierPayment.orderId}
                        disabled={!canWriteFinance}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {orderOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}{option.hint ? ` · ${option.hint}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">供应商名称</label>
                      <input
                        type="text"
                        name="supplierName"
                        defaultValue={selectedSupplierPayment.supplierName}
                        disabled={!canWriteFinance}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">类别</label>
                      <select
                        name="category"
                        defaultValue={selectedSupplierPayment.category}
                        disabled={!canWriteFinance}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="vehicle">车辆</option>
                        <option value="driver">司机</option>
                        <option value="guide">导游</option>
                        <option value="hotel">酒店</option>
                        <option value="meal">餐食</option>
                        <option value="ticket">门票</option>
                        <option value="misc">杂费</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">付款日期</label>
                      <input
                        type="date"
                        name="paidOn"
                        defaultValue={selectedSupplierPayment.paidOn}
                        disabled={!canWriteFinance}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">金额 JPY</label>
                      <input
                        type="number"
                        min="1"
                        step="1000"
                        name="amountJpy"
                        defaultValue={selectedSupplierPayment.amountJpy}
                        disabled={!canWriteFinance}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>
              </FormSection>

              <FormSection title="方式与追溯信息" description="把付款方式、状态、流水号和备注补齐，现金流和供应商台账才会更可信。">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">付款方式</label>
                      <select
                        name="method"
                        defaultValue={selectedSupplierPayment.method}
                        disabled={!canWriteFinance}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="bank_transfer">银行转账</option>
                        <option value="cash">现金</option>
                        <option value="credit_card">信用卡</option>
                        <option value="other">其他</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">状态</label>
                      <select
                        name="status"
                        defaultValue={selectedSupplierPayment.status}
                        disabled={!canWriteFinance}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="pending">待付款</option>
                        <option value="paid">已付款</option>
                        <option value="reconciled">已对账</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">流水号 / 备注编号</label>
                      <input
                        type="text"
                        name="referenceNo"
                        defaultValue={selectedSupplierPayment.referenceNo}
                        disabled={!canWriteFinance}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">备注</label>
                    <textarea
                      name="notes"
                      rows={3}
                      defaultValue={selectedSupplierPayment.notes}
                      disabled={!canWriteFinance}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>
              </FormSection>

              <PendingSubmitButton
                disabled={!canWriteFinance}
                pendingLabel="正在保存付款..."
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                保存付款记录
              </PendingSubmitButton>
            </form>
            <form id={`delete-supplier-payment-${selectedSupplierPayment.id}`} action={deleteSupplierPayment}>
              <input type="hidden" name="paymentId" value={selectedSupplierPayment.id} />
            </form>
            <div className="flex justify-end">
              <ConfirmActionButton formId={`delete-supplier-payment-${selectedSupplierPayment.id}`} title="确认删除这条供应商付款？" description="删除后净现金流会重新计算，请仅用于修正错误付款记录。" confirmLabel="确认删除" disabled={!canWriteFinance}>删除错误付款</ConfirmActionButton>
            </div>
            </div>
          ) : (
            <EmptyStateCard title="还没有供应商付款记录" description="先从上方登记第一笔付款，这里就会开始显示供应商、金额、状态和流水号。" />
          )}
        </div>
      </SectionCard>

      <SlideOver
        open={receiptDrawerOpen && !!selectedReceipt}
        onClose={() => setReceiptDrawerOpen(false)}
        title={selectedReceipt?.orderNo ?? "回款详情"}
        description="把回款状态、金额、方式和所属客户集中到一个抽屉里，方便财务快速核对。"
      >
        {selectedReceipt ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Receipt Brief</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedReceipt.orderNo}</p>
              <p className="mt-1 text-sm text-slate-600">{selectedReceipt.customerName}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge label={selectedReceipt.statusLabel} tone={selectedReceipt.status === "reconciled" ? "success" : selectedReceipt.status === "received" ? "info" : "warning"} />
                <span className="text-xs text-slate-500">{selectedReceipt.methodLabel}</span>
              </div>
            </div>

            <StatStrip
              items={[
                { label: "到账金额", value: selectedReceipt.amountLabel },
                { label: "到账日期", value: selectedReceipt.receivedOnLabel },
                { label: "回款方式", value: selectedReceipt.methodLabel },
                { label: "状态", value: selectedReceipt.statusLabel },
              ]}
              columnsClassName="md:grid-cols-2"
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">追溯信息</p>
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                <p>流水号：{selectedReceipt.referenceNo || "未设置"}</p>
                <p>备注：{selectedReceipt.notes || "当前没有备注。"}</p>
              </div>
            </div>
          </div>
        ) : null}
      </SlideOver>

      <SlideOver
        open={supplierPaymentDrawerOpen && !!selectedSupplierPayment}
        onClose={() => setSupplierPaymentDrawerOpen(false)}
        title={selectedSupplierPayment?.supplierName ?? "付款详情"}
        description="把供应商付款状态、金额、类别和流水号放进一个抽屉里，方便月底对账。"
      >
        {selectedSupplierPayment ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Payment Brief</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedSupplierPayment.supplierName}</p>
              <p className="mt-1 text-sm text-slate-600">{selectedSupplierPayment.orderNo}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge label={selectedSupplierPayment.statusLabel} tone={selectedSupplierPayment.status === "reconciled" ? "success" : selectedSupplierPayment.status === "paid" ? "info" : "warning"} />
                <span className="text-xs text-slate-500">{selectedSupplierPayment.categoryLabel}</span>
              </div>
            </div>

            <StatStrip
              items={[
                { label: "付款金额", value: selectedSupplierPayment.amountLabel },
                { label: "付款日期", value: selectedSupplierPayment.paidOnLabel },
                { label: "付款方式", value: selectedSupplierPayment.methodLabel },
                { label: "类别", value: selectedSupplierPayment.categoryLabel },
              ]}
              columnsClassName="md:grid-cols-2"
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">追溯信息</p>
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                <p>流水号：{selectedSupplierPayment.referenceNo || "未设置"}</p>
                <p>备注：{selectedSupplierPayment.notes || "当前没有备注。"}</p>
              </div>
            </div>
          </div>
        ) : null}
      </SlideOver>
    </div>
  );
}
