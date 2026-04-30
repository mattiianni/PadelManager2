
import React, { useState, useEffect } from 'react';
import { usePadelStore } from '../hooks/usePadelStore.tsx';
import { Player, FieldPosition } from '../types.ts';
import Card from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import Modal from '../components/ui/Modal.tsx';
import { TrashIcon, ChevronDownIcon, PencilIcon, InfoIcon, PrintIcon } from '../components/ui/Icons.tsx';
import PlayerProfileModal from '../components/PlayerProfileModal.tsx';
import { printPlayerProfiles } from '../services/printService.ts';

const PlayerListSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-10 bg-gray-50 dark:bg-gray-700/50 rounded-t-lg w-full"></div>
        <div className="space-y-px">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/5"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
                    <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const PlayersPage: React.FC = () => {
    const { players, matches, tournaments, eloHistory, addPlayer, deletePlayer, updatePlayerAndElo, loading } = usePadelStore();
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [position, setPosition] = useState<FieldPosition>(FieldPosition.Indifferente);
    const [isPlayerListCollapsed, setIsPlayerListCollapsed] = useState(true);
    const [sortBy, setSortBy] = useState<'name' | 'surname' | 'elo'>('name');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
    const [profilePlayer, setProfilePlayer] = useState<Player | null>(null);
    const [editName, setEditName] = useState('');
    const [editSurname, setEditSurname] = useState('');
    const [editPosition, setEditPosition] = useState<FieldPosition>(FieldPosition.Indifferente);
    const [editElo, setEditElo] = useState('');
    const [editTournamentId, setEditTournamentId] = useState<string>('');

    useEffect(() => {
        if (playerToEdit) {
            setEditName(playerToEdit.name);
            setEditSurname(playerToEdit.surname);
            setEditPosition(playerToEdit.position);
            setEditElo(playerToEdit.currentElo.toFixed(2));
            setEditTournamentId('');
        }
    }, [playerToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && surname.trim()) {
            setIsSubmitting(true);
            try {
                await addPlayer(name, surname, position);
                setName('');
                setSurname('');
                setPosition(FieldPosition.Indifferente);
            } catch (error) {
                console.error("Failed to add player:", error);
                // Optionally show an error message to the user
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleDelete = async (playerId: string) => {
        if (window.confirm('Are you sure you want to delete this player? This will also delete all their associated matches.')) {
           await deletePlayer(playerId);
        }
    };
    
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newElo = parseFloat(editElo);
        if (playerToEdit && editName.trim() && editSurname.trim() && !isNaN(newElo)) {
            setIsSubmitting(true);
            try {
                await updatePlayerAndElo(playerToEdit.id, {
                    name: editName,
                    surname: editSurname,
                    position: editPosition,
                }, newElo, editTournamentId || undefined);
                setPlayerToEdit(null);
            } catch (error) {
                console.error("Failed to update player:", error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const sortedPlayers = [...players].sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'surname') return a.surname.localeCompare(b.surname);
        return b.currentElo - a.currentElo; // ELO descending
    });

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card title={
                        <div>
                            <p className="section-kicker">Roster</p>
                            <p className="mt-1 text-lg font-semibold text-app dark:text-white">Inserisci Nuovo Giocatore</p>
                        </div>
                    }>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Nome</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label htmlFor="surname" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Cognome</label>
                                <input
                                    type="text"
                                    id="surname"
                                    value={surname}
                                    onChange={(e) => setSurname(e.target.value)}
                                    className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label htmlFor="position" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Posizione in Campo</label>
                                <select
                                    id="position"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value as FieldPosition)}
                                    className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                    disabled={isSubmitting}
                                >
                                    {Object.values(FieldPosition).map(pos => (
                                        <option key={pos} value={pos}>{pos}</option>
                                    ))}
                                </select>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? 'Salvataggio...' : 'Aggiungi giocatore'}
                            </Button>
                        </form>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card title={
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center flex-wrap gap-2">
                                    <span className="text-app dark:text-white">Elenco Giocatori Inseriti</span>
                                    <span className="rounded-full border border-slate-200/70 bg-slate-100/80 px-2.5 py-0.5 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                                        {players.length}
                                    </span>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => printPlayerProfiles(
                                        players.map(p => p.id),
                                        players,
                                        matches,
                                        eloHistory,
                                        tournaments
                                    )}
                                    disabled={loading || players.length === 0}
                                >
                                    <span className="flex items-center gap-1"><PrintIcon /> Stampa riepilogo</span>
                                </Button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex rounded-xl border border-slate-200/70 bg-slate-100/80 p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
                                    <button onClick={() => setSortBy('name')} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${sortBy === 'name' ? 'bg-sky-500 text-[#00344d]' : 'text-slate-700 dark:text-slate-300'}`}>Nome</button>
                                    <button onClick={() => setSortBy('surname')} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${sortBy === 'surname' ? 'bg-sky-500 text-[#00344d]' : 'text-slate-700 dark:text-slate-300'}`}>Cognome</button>
                                    <button onClick={() => setSortBy('elo')} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${sortBy === 'elo' ? 'bg-sky-500 text-[#00344d]' : 'text-slate-700 dark:text-slate-300'}`}>ELO</button>
                                </div>
                                <button
                                    onClick={() => setIsPlayerListCollapsed(!isPlayerListCollapsed)}
                                    className="rounded-full p-1 hover:bg-white/10"
                                    aria-label={isPlayerListCollapsed ? 'Expand player list' : 'Collapse player list'}
                                    aria-expanded={!isPlayerListCollapsed}
                                >
                                    <ChevronDownIcon className={`h-5 w-5 transition-transform duration-200 ${isPlayerListCollapsed ? '' : 'rotate-180'}`} />
                                </button>
                            </div>
                        </div>
                    }>
                        <div className="overflow-x-auto">
                           {loading ? (
                                <PlayerListSkeleton />
                           ) : (
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                 <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th scope="col" className="px-2 sm:px-4 py-3">Name</th>
                                        <th scope="col" className="px-2 sm:px-4 py-3 whitespace-nowrap">ELO</th>
                                        <th scope="col" className="px-1 sm:px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                {!isPlayerListCollapsed && (
                                    <tbody>
                                        {sortedPlayers.map(player => (
                                            <tr key={player.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-2 sm:px-4 py-3 font-semibold text-gray-900 dark:text-white break-words">{sortBy === 'surname' ? `${player.surname} ${player.name}` : `${player.name} ${player.surname}`}</td>
                                                <td className="px-2 sm:px-4 py-3 font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">{player.currentElo.toFixed(2)}</td>
                                                <td className="px-1 sm:px-4 py-3">
                                                    <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                                                        <button
                                                            onClick={() => setProfilePlayer(player)}
                                                            className="p-1.5 sm:p-2 rounded-md text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                                                            aria-label="Profilo giocatore"
                                                        >
                                                            <InfoIcon />
                                                        </button>
                                                        <Button variant="secondary" size="sm" onClick={() => setPlayerToEdit(player)} className="!p-1.5 sm:!p-2">
                                                            <PencilIcon className="h-5 w-5" />
                                                        </Button>
                                                        <Button variant="danger" size="sm" onClick={() => handleDelete(player.id)} className="!p-1.5 sm:!p-2">
                                                            <TrashIcon />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                )}
                            </table>
                           )}
                            {!isPlayerListCollapsed && !loading && sortedPlayers.length === 0 && (
                                <p className="text-center py-8 text-gray-500">No players have been added yet.</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
            <PlayerProfileModal player={profilePlayer} onClose={() => setProfilePlayer(null)} />
            <Modal isOpen={!!playerToEdit} onClose={() => setPlayerToEdit(null)} title="Edit Player">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                        <input
                            type="text"
                            id="edit-name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-surname" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Surname</label>
                        <input
                            type="text"
                            id="edit-surname"
                            value={editSurname}
                            onChange={(e) => setEditSurname(e.target.value)}
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-position" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Preferred Position</label>
                        <select
                            id="edit-position"
                            value={editPosition}
                            onChange={(e) => setEditPosition(e.target.value as FieldPosition)}
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            disabled={isSubmitting}
                        >
                            {Object.values(FieldPosition).map(pos => (
                                <option key={pos} value={pos}>{pos}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="edit-elo" className="block text-sm font-medium text-gray-500 dark:text-gray-400">ELO</label>
                        <input
                            type="number"
                            step="0.01"
                            id="edit-elo"
                            value={editElo}
                            onChange={(e) => setEditElo(e.target.value)}
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            required
                            disabled={isSubmitting}
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Modificando l'ELO viene creato un aggiornamento manuale.</p>
                    </div>
                    {parseFloat(editElo) !== playerToEdit?.currentElo && (
                    <div>
                        <label htmlFor="edit-tournament" className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                            Aggiorna anche in
                        </label>
                        <select
                            id="edit-tournament"
                            value={editTournamentId}
                            onChange={(e) => setEditTournamentId(e.target.value)}
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            disabled={isSubmitting}
                        >
                            <option value="">Solo classifica generale</option>
                            {Array.from(new Set(tournaments.map(t => t.giornataName || t.name))).map(seriesName => {
                                const seriesTournaments = tournaments.filter(t => (t.giornataName || t.name) === seriesName);
                                const lastTournament = seriesTournaments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                                return (
                                    <option key={lastTournament.id} value={lastTournament.id}>
                                        {seriesName} (ultima giornata: {new Date(lastTournament.date).toLocaleDateString('it-IT')})
                                    </option>
                                );
                            })}
                        </select>
                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            {editTournamentId
                                ? '⚠️ Il delta verrà registrato anche nella classifica di quel torneo.'
                                : 'Solo il punteggio globale verrà aggiornato.'}
                        </p>
                    </div>
                    )}
                    <div className="flex justify-end pt-4">
                        <Button type="button" variant="secondary" onClick={() => setPlayerToEdit(null)} className="mr-2" disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Salvataggio...' : 'Salva Modifiche'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default PlayersPage;
