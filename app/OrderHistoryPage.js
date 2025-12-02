"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";
import { showInfo, showError } from "./utils/swal";
import { InlineLoading } from "./components/PageLoading";
import formatPrice from "./utils/format";

const formatDate = (d) => {
  try {
    return new Date(d).toLocaleString("id-ID");
  } catch {
    return d;
  }
};

const TrackingTimeline = ({ history = [] }) => {
  if (!Array.isArray(history) || history.length === 0) return null;
  return (
    <div className="mt-3">
      <div className="text-sm font-medium mb-2">Perjalanan Paket</div>
      <ol className="border-l border-[rgb(var(--border))] ml-3">
        {history.map((h, idx) => (
          <li key={idx} className="mb-4 ml-6">
            <span className="absolute -left-3 mt-1 w-3 h-3 rounded-full bg-[rgb(var(--accent))]"></span>
            <div className="text-sm font-semibold">{h.status || "Update"}</div>
            <div className="text-xs text-[rgb(var(--text-muted))]">
              {h.location
                ? `${h.location} • ${formatDate(h.timestamp)}`
                : formatDate(h.timestamp)}
            </div>
            {h.note && (
              <div className="text-xs text-[rgb(var(--text))] mt-1">{h.note}</div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};

const OrderHistoryPage = () => {
  const { token, user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [refreshingIds, setRefreshingIds] = useState(new Set());

  // Check authentication
  useEffect(() => {
    if (!token || !user) {
      router.push('/login?redirect=/orders');
      return;
    }
    setAuthChecking(false);
  }, [token, user, router]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/orders/user?page=${page}&pageSize=${pageSize}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load orders");
      }
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      // sync page/pageSize from server response if present
      if (data.page) setPage(Number(data.page));
      if (data.pageSize) setPageSize(Number(data.pageSize));
    } catch (e) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize]);

  useEffect(() => {
    if (token && user) {
      fetchOrders();
    }
  }, [fetchOrders, token, user]);

  if (authChecking) return <InlineLoading text="Memeriksa autentikasi..." variant="dots" size="md" />;
  if (loading)
    return <InlineLoading text="Memuat riwayat pesanan..." variant="dots" size="md" />;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!orders || orders.length === 0)
    return <div className="p-6 text-muted">Belum ada pesanan.</div>;

  return (
    <div className="bg-surface dark:bg-[rgb(var(--bg))] min-h-screen">
      <div className="px-4 sm:px-8 lg:px-16 py-6 sm:py-12 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center text-xs sm:text-sm text-[rgb(var(--text-muted))] mb-4 sm:mb-8">
          <a href="/" className="hover:text-[rgb(var(--accent))]">
            Beranda
          </a>{" "}
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 mx-1 sm:mx-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="m9 18 6-6-6-6"
            />
          </svg>
          <span className="text-[rgb(var(--text))] font-medium">
            Riwayat Pesanan
          </span>
        </nav>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-8 text-[rgb(var(--text))]">
          Riwayat Pesanan
        </h1>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6 sm:mb-8">
          <p className="text-sm sm:text-base text-[rgb(var(--text-muted))]">
            Lihat semua pesanan Anda di sini.
          </p>
          <button
            onClick={fetchOrders}
            className="btn-secondary px-4 py-2 rounded-full text-sm sm:text-base"
            aria-label="Segarkan riwayat pesanan"
          >
            Segarkan
          </button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-base rounded-xl p-3 sm:p-4 bg-surface-alt shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-300"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
                <div>
                  <div className="text-xs text-muted tracking-wide">
                    Order #{order.id}
                  </div>
                  <div className="text-base sm:text-lg font-medium">
                    {formatDate(order.created_at)}
                  </div>
                  <div className="text-xs sm:text-sm text-muted flex flex-wrap items-center mt-1 gap-1">
                    Status:
                    <span
                      className={`ml-1 sm:ml-2 px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                        order.status === "completed" || order.status === "Selesai"
                          ? "bg-[rgb(var(--status-success-bg))] text-[rgb(var(--status-success-text))]"
                          : order.status === "processing" || order.status === "Diproses" || order.status === "Menunggu" || order.status === "Dalam Pengiriman"
                          ? "bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))]"
                          : order.status === "shipped" || order.status === "Dikirim"
                          ? "bg-[rgb(var(--status-info-bg))] text-[rgb(var(--status-info-text))]"
                          : order.status === "cancelled" || order.status === "Dibatalkan"
                          ? "bg-[rgb(var(--status-danger-bg))] text-[rgb(var(--status-danger-text))]"
                          : "bg-[rgb(var(--status-neutral-bg))] text-[rgb(var(--status-neutral-text))]"
                      }`}
                    >
                      {order.status === "completed" || order.status === "Selesai"
                        ? "Selesai"
                        : order.status === "processing" || order.status === "Diproses" || order.status === "Menunggu"
                        ? "Diproses"
                        : order.status === "shipped" || order.status === "Dikirim"
                        ? "Dikirim"
                        : order.status === "cancelled" || order.status === "Dibatalkan"
                        ? "Dibatalkan"
                        : order.status === "Dalam Pengiriman"
                        ? "Dalam Pengiriman"
                        : order.status}
                    </span>
                    {(() => {
                      try {
                        const metadata = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata;
                        return metadata.seller_name ? (
                          <span className="ml-2 sm:ml-4 text-[10px] sm:text-xs">
                            Penjual: <span className="font-medium">{metadata.seller_name}</span>
                          </span>
                        ) : null;
                      } catch (e) {
                        return null;
                      }
                    })()}
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <div className="text-xs text-muted">Total</div>
                  <div className="text-lg sm:text-xl font-semibold accent-text">
                    Rp {formatPrice(order.total)}
                  </div>
                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        // Navigate to order detail (if exists) or show modal
                        showInfo("Detail Pesanan", `Detail pesanan #${order.id}`);
                      }}
                      className="text-xs bg-[rgb(var(--status-info-bg))] text-[rgb(var(--status-info-text))] hover:opacity-80 px-2 sm:px-3 py-1 rounded transition-colors"
                    >
                      Detail
                    </button>
                    {order.status === "completed" && (
                      <button
                        onClick={() => {
                          // Reorder functionality
                          showInfo("Info", "Fitur reorder akan segera hadir!");
                        }}
                        className="text-xs bg-[rgb(var(--status-success-bg))] text-[rgb(var(--status-success-text))] hover:opacity-80 px-2 sm:px-3 py-1 rounded transition-colors"
                      >
                        Pesan Lagi
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xs sm:text-sm font-medium mb-2 text-muted">Items</div>
                <div className="space-y-2">
                  {order.order_items.map((it) => (
                    <div
                      key={it.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 border border-base p-2 rounded bg-surface"
                    >
                      <div className="flex-1 w-full">
                        <div className="font-medium text-sm sm:text-base">{it.name}</div>
                        <div className="text-[10px] sm:text-xs text-muted">
                          Qty: {it.quantity} — Rp {formatPrice(it.unit_price)}
                        </div>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <div className="font-semibold accent-text text-sm sm:text-base">
                          Rp {formatPrice(it.total_price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {order.metadata && (() => {
                try {
                  const metadata = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata;
                  return metadata.tracking ? (
                    <div className="mt-3 text-xs sm:text-sm text-muted">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <div>
                          <div>
                            Tracking:{" "}
                            <span className="font-medium accent-text">
                              {metadata.tracking.provider || "—"}
                            </span>
                          </div>
                          <div>
                            No. Resi:{" "}
                            <span className="font-medium accent-text break-all">
                              {metadata.tracking.tracking_number || "—"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <button
                            onClick={async () => {
                              // refresh tracking for this order
                              if (!token) return;
                              const id = order.id;
                              setRefreshingIds((s) => new Set([...s, id]));
                              try {
                                const res = await fetch(
                                  `/api/orders/${id}/tracking/refresh`,
                                  {
                                    method: "POST",
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                      "Content-Type": "application/json",
                                    },
                                  }
                                );
                                if (!res.ok) {
                                  const err = await res.json().catch(() => ({}));
                                  throw new Error(
                                    err.error || "Gagal memperbarui tracking"
                                  );
                                }
                                const data = await res.json();
                                // update order metadata locally
                                setOrders((prev) =>
                                  (prev || []).map((o) =>
                                    o.id === id
                                      ? {
                                          ...o,
                                          metadata: data.metadata || data.metadata,
                                        }
                                      : o
                                  )
                                );
                              } catch (e) {
                                // non-fatal: show alert
                                showError(
                                  "Gagal",
                                  (e && e.message) || "Gagal memperbarui tracking"
                                );
                              } finally {
                                setRefreshingIds((s) => {
                                  const n = new Set(s);
                                  n.delete(order.id);
                                  return n;
                                });
                              }
                            }}
                            disabled={refreshingIds.has(order.id)}
                            className="text-sm btn-secondary px-3 py-1 rounded disabled:opacity-50"
                          >
                            {refreshingIds.has(order.id)
                              ? "Memperbarui..."
                              : "Perbarui Status"}
                          </button>
                        </div>
                      </div>
                      <TrackingTimeline history={metadata.tracking.history} />
                    </div>
                  ) : null;
                } catch (e) {
                  return null;
                }
              })()}
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-[rgb(var(--text-muted))]">
            Halaman {page} — total {total} pesanan
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <label
                htmlFor="pageSize"
                className="text-xs sm:text-sm text-[rgb(var(--text-muted))]"
              >
                Per halaman:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="border border-base bg-surface rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-accent focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 btn-secondary rounded-full disabled:opacity-50 text-xs sm:text-sm"
                aria-label="Halaman sebelumnya"
              >
                Sebelumnya
              </button>
              <button
                disabled={page * pageSize >= total}
                onClick={() => setPage((p) => p + 1)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 btn-secondary rounded-full disabled:opacity-50 text-xs sm:text-sm"
                aria-label="Halaman berikutnya"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;
