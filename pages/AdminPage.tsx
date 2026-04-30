
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, getAuthToken } from '../hooks/useAuth.tsx';
import Card from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';

interface Workspace {
    id: string;
    name: string;
    owner_name: string | null;
    owner_email: string | null;
    is_active: boolean;
    created_at: string;
    player_count: string;
    tournament_count: string;
    active_codes: string;
}

interface AccessCode {
    id: string;
    label: string | null;
    code_plain: string | null;
    is_admin: boolean;
    is_active: boolean;
    created_at: string;
    expires_at: string | null;
    last_used_at: string | null;
    failed_attempts: number;
    workspace_name: string;
    workspace_id: string;
}

interface AuditLog {
    id: string;
    action: string;
    ip_address: string | null;
    details: any;
    created_at: string;
    workspace_name: string | null;
}

async function adminApi<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = getAuthToken();
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers as Record<string, string> || {}),
        },
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Errore' }));
        throw new Error(data.message || 'API request failed');
    }
    return response.json();
}

const AdminPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [codes, setCodes] = useState<AccessCode[]>([]);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [activeTab, setActiveTab] = useState<'workspaces' | 'codes' | 'logs'>('workspaces');
    const [loading, setLoading] = useState(true);

    // New workspace form
    const [newWsName, setNewWsName] = useState('');
    const [newWsOwner, setNewWsOwner] = useState('');

    // New code form
    const [newCodeWsId, setNewCodeWsId] = useState('');
    const [newCodeValue, setNewCodeValue] = useState('');
    const [newCodeLabel, setNewCodeLabel] = useState('');
    const [newCodeIsAdmin, setNewCodeIsAdmin] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [wsData, codesData, logsData] = await Promise.all([
                adminApi<{ workspaces: Workspace[] }>('/api/admin/workspaces'),
                adminApi<{ codes: AccessCode[] }>('/api/admin/codes'),
                adminApi<{ logs: AuditLog[] }>('/api/admin/audit-logs?limit=50'),
            ]);
            setWorkspaces(wsData.workspaces);
            setCodes(codesData.codes);
            setLogs(logsData.logs);
            if (wsData.workspaces.length > 0 && !newCodeWsId) {
                setNewCodeWsId(wsData.workspaces[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAdmin) fetchAll();
    }, [isAdmin, fetchAll]);

    if (!isAdmin) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500 dark:text-gray-400 text-lg">Accesso riservato agli amministratori</p>
            </div>
        );
    }

    const handleCreateWorkspace = async () => {
        if (!newWsName.trim()) return;
        try {
            await adminApi('/api/admin/workspaces', {
                method: 'POST',
                body: JSON.stringify({ name: newWsName, ownerName: newWsOwner }),
            });
            setNewWsName('');
            setNewWsOwner('');
            await fetchAll();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleGenerateCode = async () => {
        if (!newCodeWsId || !newCodeValue || !/^\d{6}$/.test(newCodeValue)) {
            alert('Inserisci un codice valido di 6 cifre');
            return;
        }
        try {
            const result = await adminApi<{ accessCode: any; code: string }>('/api/admin/codes/generate', {
                method: 'POST',
                body: JSON.stringify({
                    workspaceId: newCodeWsId,
                    code: newCodeValue,
                    label: newCodeLabel,
                    isAdmin: newCodeIsAdmin,
                }),
            });
            setGeneratedCode(result.code);
            setNewCodeValue('');
            setNewCodeLabel('');
            setNewCodeIsAdmin(false);
            await fetchAll();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const [settingPlainId, setSettingPlainId] = useState<string | null>(null);
    const [plainInput, setPlainInput] = useState('');

    const handleSetPlain = async (codeId: string) => {
        if (!/^\d{6}$/.test(plainInput)) {
            alert('Inserisci il codice a 6 cifre');
            return;
        }
        try {
            await adminApi(`/api/admin/codes/${codeId}/set-plain`, {
                method: 'PUT',
                body: JSON.stringify({ code: plainInput }),
            });
            setSettingPlainId(null);
            setPlainInput('');
            await fetchAll();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleImpersonate = async (workspaceId: string) => {
        try {
            const result = await adminApi<{ token: string; workspace: { id: string; name: string } }>('/api/admin/impersonate', {
                method: 'POST',
                body: JSON.stringify({ workspaceId }),
            });
            localStorage.setItem('padel_elo_token', result.token);
            localStorage.setItem('padel_elo_workspace', JSON.stringify(result.workspace));
            window.location.href = '/';
        } catch (error: any) {
            alert(error.message);
        }
    };

    const [recalculating, setRecalculating] = useState(false);
    const [recalcResult, setRecalcResult] = useState<{ corrected: number; changes: { name: string; oldElo: number; newElo: number; diff: number }[] } | null>(null);

    const handleRecalculateElos = async () => {
        if (!confirm('Ricalcola ELO da storico per TUTTI i workspace? I current_elo verranno allineati alla somma dei delta in elo_history.')) return;
        setRecalculating(true);
        setRecalcResult(null);
        try {
            const result = await adminApi<{ corrected: number; changes: any[] }>('/api/admin/recalculate-elos', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            setRecalcResult(result);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setRecalculating(false);
        }
    };

    const handleDeactivateCode = async (codeId: string) => {
        if (!confirm('Sei sicuro di voler disattivare questo codice?')) return;
        try {
            await adminApi(`/api/admin/codes/${codeId}`, { method: 'DELETE' });
            await fetchAll();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDeleteCode = async (codeId: string) => {
        if (!confirm('Sei sicuro di voler cancellare definitivamente questo codice disattivato?')) return;
        try {
            await adminApi(`/api/admin/codes/${codeId}/permanent`, { method: 'DELETE' });
            await fetchAll();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const formatDate = (d: string | null) => {
        if (!d) return '-';
        return new Date(d).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pannello Admin</h2>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                {(['workspaces', 'codes', 'logs'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
                            activeTab === tab
                                ? 'bg-sky-600 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        {tab === 'workspaces' ? 'Workspace' : tab === 'codes' ? 'Codici Accesso' : 'Audit Log'}
                    </button>
                ))}
            </div>

            {/* Workspaces Tab */}
            {activeTab === 'workspaces' && (
                <div className="space-y-4">
                    <Card title="Crea Nuovo Workspace">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={newWsName}
                                onChange={e => setNewWsName(e.target.value)}
                                placeholder="Nome workspace"
                                className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                            />
                            <input
                                type="text"
                                value={newWsOwner}
                                onChange={e => setNewWsOwner(e.target.value)}
                                placeholder="Nome proprietario"
                                className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                            />
                            <Button variant="primary" onClick={handleCreateWorkspace}>Crea</Button>
                        </div>
                    </Card>

                    <Card title={`Workspace (${workspaces.length})`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                                        <th className="pb-2 pr-4">Nome</th>
                                        <th className="pb-2 pr-4">Proprietario</th>
                                        <th className="pb-2 pr-4">Giocatori</th>
                                        <th className="pb-2 pr-4">Tornei</th>
                                        <th className="pb-2 pr-4">Codici</th>
                                        <th className="pb-2 pr-4">Creato</th>
                                        <th className="pb-2">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-900 dark:text-gray-100">
                                    {workspaces.map(ws => (
                                        <tr key={ws.id} className="border-b dark:border-gray-700">
                                            <td className="py-2 pr-4 font-medium">{ws.name}</td>
                                            <td className="py-2 pr-4">{ws.owner_name || '-'}</td>
                                            <td className="py-2 pr-4">{ws.player_count}</td>
                                            <td className="py-2 pr-4">{ws.tournament_count}</td>
                                            <td className="py-2 pr-4">{ws.active_codes}</td>
                                            <td className="py-2 pr-4">{formatDate(ws.created_at)}</td>
                                            <td className="py-2">
                                                <button
                                                    onClick={() => handleImpersonate(ws.id)}
                                                    className="text-xs text-sky-500 hover:text-sky-700 dark:hover:text-sky-400 font-medium"
                                                >
                                                    Entra &rarr;
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Ricalcola ELO */}
                    <Card title="🔧 Ricalcola ELO da Storico">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Allinea il <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">current_elo</code> di ogni giocatore alla somma reale dei delta in <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">elo_history</code>.
                            Corregge eventuali disallineamenti causati da tornei eliminati o modificati. Si applica a <strong>tutti i workspace</strong>.
                        </p>
                        <button
                            onClick={handleRecalculateElos}
                            disabled={recalculating}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            {recalculating ? 'Ricalcolo in corso...' : '⚡ Ricalcola ELO (tutti i workspace)'}
                        </button>
                        {recalcResult !== null && (
                            <div className="mt-3">
                                {recalcResult.corrected === 0 ? (
                                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">✅ Tutto allineato, nessuna correzione necessaria.</p>
                                ) : (
                                    <>
                                        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-2">⚡ Corretti {recalcResult.corrected} giocatori:</p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-100 dark:bg-gray-700">
                                                        <th className="text-left p-2">Giocatore</th>
                                                        <th className="text-right p-2">ELO Precedente</th>
                                                        <th className="text-right p-2">ELO Corretto</th>
                                                        <th className="text-right p-2">Diff</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recalcResult.changes.map((c, i) => (
                                                        <tr key={i} className="border-t border-gray-200 dark:border-gray-600">
                                                            <td className="p-2">{c.name}</td>
                                                            <td className="text-right p-2">{c.oldElo.toFixed(2)}</td>
                                                            <td className="text-right p-2">{c.newElo.toFixed(2)}</td>
                                                            <td className={`text-right p-2 font-medium ${c.diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {c.diff > 0 ? '+' : ''}{c.diff.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* Codes Tab */}
            {activeTab === 'codes' && (
                <div className="space-y-4">
                    <Card title="Genera Nuovo Codice">
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    value={newCodeWsId}
                                    onChange={e => setNewCodeWsId(e.target.value)}
                                    className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                                >
                                    {workspaces.map(ws => (
                                        <option key={ws.id} value={ws.id}>{ws.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    value={newCodeValue}
                                    onChange={e => setNewCodeValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="Codice 6 cifre"
                                    maxLength={6}
                                    inputMode="numeric"
                                    className="w-40 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white text-center font-mono text-lg tracking-wider"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 items-center">
                                <input
                                    type="text"
                                    value={newCodeLabel}
                                    onChange={e => setNewCodeLabel(e.target.value)}
                                    placeholder="Etichetta (es. Codice Marco)"
                                    className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                                />
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={newCodeIsAdmin}
                                        onChange={e => setNewCodeIsAdmin(e.target.checked)}
                                        className="rounded"
                                    />
                                    Accesso Admin
                                </label>
                                <Button variant="primary" onClick={handleGenerateCode}>Genera</Button>
                            </div>
                        </div>
                        {generatedCode && (
                            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-green-800 dark:text-green-300 text-sm">
                                    Codice creato con successo: <span className="font-mono font-bold text-lg">{generatedCode}</span>
                                </p>
                                <p className="text-green-600 dark:text-green-400 text-xs mt-1">Comunica questo codice al destinatario. Potrai sempre rivederlo nella tabella qui sotto.</p>
                            </div>
                        )}
                    </Card>

                    <Card title={`Codici Accesso (${codes.length})`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                                        <th className="pb-2 pr-4">Etichetta</th>
                                        <th className="pb-2 pr-4">Codice</th>
                                        <th className="pb-2 pr-4">Workspace</th>
                                        <th className="pb-2 pr-4">Admin</th>
                                        <th className="pb-2 pr-4">Stato</th>
                                        <th className="pb-2 pr-4">Ultimo uso</th>
                                        <th className="pb-2">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-900 dark:text-gray-100">
                                    {codes.map(code => (
                                        <tr key={code.id} className={`border-b dark:border-gray-700 ${!code.is_active ? 'opacity-50' : ''}`}>
                                            <td className="py-2 pr-4">{code.label || '-'}</td>
                                            <td className="py-2 pr-4 font-mono font-bold tracking-wider">
                                                {code.code_plain ? (
                                                    <span className="text-sky-600 dark:text-sky-400">{code.code_plain}</span>
                                                ) : settingPlainId === code.id ? (
                                                    <span className="flex items-center gap-1">
                                                        <input
                                                            type="text"
                                                            value={plainInput}
                                                            onChange={e => setPlainInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                            placeholder="000000"
                                                            maxLength={6}
                                                            inputMode="numeric"
                                                            className="w-20 px-1 py-0.5 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-center"
                                                            autoFocus
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') handleSetPlain(code.id);
                                                                if (e.key === 'Escape') { setSettingPlainId(null); setPlainInput(''); }
                                                            }}
                                                        />
                                                        <button onClick={() => handleSetPlain(code.id)} className="text-xs text-green-600 hover:text-green-800">OK</button>
                                                        <button onClick={() => { setSettingPlainId(null); setPlainInput(''); }} className="text-xs text-gray-400 hover:text-gray-600">X</button>
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => { setSettingPlainId(code.id); setPlainInput(''); }}
                                                        className="text-gray-400 hover:text-sky-500 cursor-pointer"
                                                        title="Clicca per impostare il codice in chiaro"
                                                    >••••••</button>
                                                )}
                                            </td>
                                            <td className="py-2 pr-4">{code.workspace_name}</td>
                                            <td className="py-2 pr-4">
                                                {code.is_admin && <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded">Admin</span>}
                                            </td>
                                            <td className="py-2 pr-4">
                                                <span className={`text-xs px-2 py-0.5 rounded ${code.is_active ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                                                    {code.is_active ? 'Attivo' : 'Disattivato'}
                                                </span>
                                            </td>
                                            <td className="py-2 pr-4 text-xs">{formatDate(code.last_used_at)}</td>
                                            <td className="py-2 flex items-center gap-3">
                                                {code.is_active && (
                                                    <>
                                                    <button
                                                        onClick={() => handleImpersonate(code.workspace_id)}
                                                        className="text-xs text-sky-500 hover:text-sky-700 dark:hover:text-sky-400 font-medium"
                                                    >
                                                        Entra &rarr;
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeactivateCode(code.id)}
                                                        className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                                    >
                                                        Disattiva
                                                    </button>
                                                    </>
                                                )}
                                                {!code.is_active && (
                                                    <button
                                                        onClick={() => handleDeleteCode(code.id)}
                                                        className="text-xs text-red-600 hover:text-red-800 dark:hover:text-red-400 font-medium"
                                                    >
                                                        Cancella
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'logs' && (
                <Card title={`Audit Log (ultimi 50)`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                                    <th className="pb-2 pr-4">Data</th>
                                    <th className="pb-2 pr-4">Azione</th>
                                    <th className="pb-2 pr-4">Workspace</th>
                                    <th className="pb-2 pr-4">IP</th>
                                    <th className="pb-2">Dettagli</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-900 dark:text-gray-100">
                                {logs.map(log => (
                                    <tr key={log.id} className="border-b dark:border-gray-700">
                                        <td className="py-2 pr-4 text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
                                        <td className="py-2 pr-4">
                                            <span className={`text-xs px-2 py-0.5 rounded ${
                                                log.action === 'login_success' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                                                log.action === 'login_failed' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                                                'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-4 text-xs">{log.workspace_name || '-'}</td>
                                        <td className="py-2 pr-4 text-xs font-mono">{log.ip_address || '-'}</td>
                                        <td className="py-2 text-xs text-gray-500 dark:text-gray-400">
                                            {log.details && typeof log.details === 'object' ? JSON.stringify(log.details) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default AdminPage;
