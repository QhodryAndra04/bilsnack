"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";
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
      <ol className="border-l border-gray-200 ml-3">
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

  if (authChecking) return <div className="p-6 text-muted">Memeriksa autentikasi...</div>;
  if (loading)
    return <div className="p-6 text-muted">Memuat riwayat pesanan...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!orders || orders.length === 0)
    return <div className="p-6 text-muted">Belum ada pesanan.</div>;

  return (
    <div className="bg-surface dark:bg-[rgb(var(--bg))] min-h-screen">
      <div className="px-8 sm:px-12 lg:px-16 py-12 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-[rgb(var(--text-muted))] mb-8">
          <a href="/" className="hover:text-[rgb(var(--accent))]">
            Beranda
          </a>{" "}
          <svg
            className="w-4 h-4 mx-2"
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

        <h1 className="text-4xl font-bold mb-8 text-[rgb(var(--text))]">
          Riwayat Pesanan
        </h1>

        <div className="flex justify-between items-center mb-8">
          <p className="text-[rgb(var(--text-muted))]">
            Lihat semua pesanan Anda di sini.
          </p>
          <button
            onClick={fetchOrders}
            className="btn-secondary px-4 py-2 rounded-full"
            aria-label="Segarkan riwayat pesanan"
          >
            Segarkan
          </button>
        </div>

        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-base rounded-lg p-4 bg-surface-alt shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-muted tracking-wide">
                    Order #{order.id}
                  </div>
                  <div className="text-lg font-medium">
                    {formatDate(order.created_at)}
                  </div>
                  <div className="text-sm text-muted flex items-center mt-1">
                    Status:
                    <span
                      className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === "completed" || order.status === "Selesai"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : order.status === "processing" || order.status === "Diproses" || order.status === "Menunggu" || order.status === "Dalam Pengiriman"
                          ? "bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))] dark:bg-[rgb(var(--accent))]/20 dark:text-[rgb(var(--accent))]/80"
                          : order.status === "shipped" || order.status === "Dikirim"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                          : order.status === "cancelled" || order.status === "Dibatalkan"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
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
                          <span className="ml-4 text-xs">
                            Penjual: <span className="font-medium">{metadata.seller_name}</span>
                          </span>
                        ) : null;
                      } catch (e) {
                        return null;
                      }
                    })()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted">Total</div>
                  <div className="text-xl font-semibold accent-text">
                    Rp {formatPrice(order.total)}
                  </div>
                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        // Navigate to order detail (if exists) or show modal
                        alert(`Detail pesanan #${order.id}`);
                      }}
                      className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                    >
                      Detail
                    </button>
                    {order.status === "completed" && (
                      <button
                        onClick={() => {
                          // Reorder functionality
                          alert("Fitur reorder akan segera hadir!");
                        }}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors"
                      >
                        Pesan Lagi
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-sm font-medium mb-2 text-muted">Items</div>
                <div className="space-y-2">
                  {order.order_items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center gap-3 border border-base p-2 rounded bg-surface"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-muted">
                          Qty: {it.quantity} — Rp {formatPrice(it.unit_price)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold accent-text">
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
                    <div className="mt-3 text-sm text-muted">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div>
                            Tracking:{" "}
                            <span className="font-medium accent-text">
                              {metadata.tracking.provider || "—"}
                            </span>
                          </div>
                          <div>
                            No. Resi:{" "}
                            <span className="font-medium accent-text">
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
                                alert(
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
        <div className="mt-12 flex items-center justify-between">
          <div className="text-sm text-[rgb(var(--text-muted))]">
            Menampilkan halaman {page} — total {total} pesanan
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="pageSize"
                className="text-sm text-[rgb(var(--text-muted))]"
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
                className="border border-base bg-surface rounded px-3 py-2 text-sm focus:border-accent focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 btn-secondary rounded-full disabled:opacity-50"
                aria-label="Halaman sebelumnya"
              >
                Sebelumnya
              </button>
              <button
                disabled={page * pageSize >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 btn-secondary rounded-full disabled:opacity-50"
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
