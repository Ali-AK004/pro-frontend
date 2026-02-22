import React, { useState, useEffect } from 'react';
import { adminAPI, handleAPIError } from '../services/adminAPI';
import { toast } from 'react-toastify';
import { FiClock, FiUser, FiMonitor, FiX } from 'react-icons/fi';
import LoadingSpinner from '@/app/components/LoadingSpinner';

const formatDate = (timestamp) => {
    if (!timestamp) return "";

    // إذا كان timestamp مصفوفة [year, month, day, hour, minute, second, nano]
    if (Array.isArray(timestamp)) {
        const [year, month, day, hour, minute, second] = timestamp;
        const date = new Date(year, month - 1, day, hour, minute, second);
        return date.toLocaleString("ar-EG", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    // إذا كان timestamp رقم (milliseconds)
    return new Date(timestamp).toLocaleString("ar-EG", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const AuditLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const size = 20;

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.auditLogs.getLogs(page, size);
            setLogs(response.data.content || []);
            setTotalPages(response.data.totalPages || 0);
        } catch (error) {
            toast.error(handleAPIError(error, 'فشل تحميل سجل الأحداث'));
        } finally {
            setLoading(false);
        }
    };
    console.log(logs)
    return (
        <div className="p-4 lg:p-8">
            <h1 className="text-3xl font-bold mb-6">سجل الأحداث</h1>
            {loading ? (
                <LoadingSpinner />
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">المستخدم</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الإجراء</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الكيان</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">المعرف</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">التاريخ</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">IP</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{log.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{log.action}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{log.entityName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{log.entityId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{log.ipAddress}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6 gap-2">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i)}
                                    className={`px-3 py-1 rounded ${page === i ? 'bg-accent text-white' : 'bg-gray-200'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AuditLogsPage;
