
import React, { useState, useEffect } from 'react';
import { usePadelStore } from '../hooks/usePadelStore.tsx';
import { Player, FieldPosition } from '../types.ts';
import Card from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import Modal from '../components/ui/Modal.tsx';
import { TrashIcon, ChevronDownIcon, PencilIcon } from '../components/ui/Icons.tsx';

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
    const { players, addPlayer, deletePlayer, updatePlayerAndElo, loading } = usePadelStore();
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [position, setPosition] = useState<FieldPosition>(FieldPosition.Indifferente);
    const [isPlayerListCollapsed, setIsPlayerListCollapsed] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
    const [editName, setEditName] = useState('');
    const [editSurname, setEditSurname] = useState('');
    const [editPosition, setEditPosition] = useState<FieldPosition>(FieldPosition.Indifferente);
    const [editElo, setEditElo] = useState('');

    useEffect(() => {
        if (playerToEdit) {
            setEditName(playerToEdit.name);
            setEditSurname(playerToEdit.surname);
            setEditPosition(playerToEdit.position);
            setEditElo(playerToEdit.currentElo.toFixed(2));
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
                }, newElo);
                setPlayerToEdit(null);
            } catch (error) {
                console.error("Failed to update player:", error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const sortedPlayers = [...players].sort((a,b) => a.name.localeCompare(b.name));

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card title="Inserisci Nuovo Giocatore">
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
                                {isSubmitting ? 'Adding...' : 'Add Player'}
                            </Button>
                        </form>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card title={
                        <div className="flex items-center justify-between">
                             <div className="flex items-center">
                                <span>Elenco Giocatori Inseriti</span>
                                <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                                    {players.length}
                                </span>
                            </div>
                            <button 
                                onClick={() => setIsPlayerListCollapsed(!isPlayerListCollapsed)} 
                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                aria-label={isPlayerListCollapsed ? 'Expand player list' : 'Collapse player list'}
                                aria-expanded={!isPlayerListCollapsed}
                            >
                                <ChevronDownIcon className={`h-5 w-5 transition-transform duration-200 ${isPlayerListCollapsed ? '' : 'rotate-180'}`} />
                            </button>
                        </div>
                    }>
                        <div className="overflow-x-auto">
                           {loading ? (
                                <PlayerListSkeleton />
                           ) : (
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 table-fixed">
                                 <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 w-1/2">Name</th>
                                        <th scope="col" className="px-4 py-3 w-1/4">ELO</th>
                                        <th scope="col" className="px-4 py-3 w-1/4">Actions</th>
                                    </tr>
                                </thead>
                                {!isPlayerListCollapsed && (
                                    <tbody>
                                        {sortedPlayers.map(player => (
                                            <tr key={player.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white truncate">{player.name} {player.surname}</td>
                                                <td className="px-4 py-3 font-bold text-sky-600 dark:text-sky-400">{player.currentElo.toFixed(2)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-2">
                                                        <Button variant="secondary" size="sm" onClick={() => setPlayerToEdit(player)} className="!p-2">
                                                            <PencilIcon />
                                                        </Button>
                                                        <Button variant="danger" size="sm" onClick={() => handleDelete(player.id)} className="!p-2">
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
                         <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Note: Changing the ELO creates a manual adjustment and will require a backend process to update history. The ELO on the player list will update after the next data refresh.</p>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="button" variant="secondary" onClick={() => setPlayerToEdit(null)} className="mr-2" disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default PlayersPage;
