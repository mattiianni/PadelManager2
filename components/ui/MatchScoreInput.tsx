import React from 'react';
import { SetScore } from '../../types.ts';
import Button from './Button.tsx';

interface MatchScoreInputProps {
    sets: SetScore[];
    onSetsChange: (sets: SetScore[]) => void;
    disabled?: boolean;
}

const MatchScoreInput: React.FC<MatchScoreInputProps> = ({ sets, onSetsChange, disabled = false }) => {
    // Assicurati che ci sia sempre almeno un set
    const displaySets = sets.length === 0 ? [{ team1: 0, team2: 0 }] : sets;
    
    const handleScoreChange = (setIndex: number, team: 'team1' | 'team2', value: string) => {
        const newSets = [...displaySets];
        const score = parseInt(value, 10);
        newSets[setIndex] = {
            ...newSets[setIndex],
            [team]: isNaN(score) ? 0 : score,
        };
        onSetsChange(newSets);
    };

    const addSet = () => {
        if (displaySets.length < 3) {
            onSetsChange([...displaySets, { team1: 0, team2: 0 }]);
        }
    };

    const removeSet = (setIndex: number) => {
        if (displaySets.length > 1) {
            onSetsChange(displaySets.filter((_, index) => index !== setIndex));
        }
    };

    return (
        <div className="flex items-center justify-center space-x-2 flex-wrap gap-2">
            {displaySets.map((set, index) => (
                <div key={index} className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-md relative group">
                    <input
                        type="number"
                        min="0"
                        value={set.team1 || ''}
                        onChange={(e) => handleScoreChange(index, 'team1', e.target.value)}
                        className="w-10 text-center bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:border-sky-500 focus:outline-none"
                        placeholder="0"
                        disabled={disabled}
                    />
                    <span>-</span>
                    <input
                        type="number"
                        min="0"
                        value={set.team2 || ''}
                        onChange={(e) => handleScoreChange(index, 'team2', e.target.value)}
                        className="w-10 text-center bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:border-sky-500 focus:outline-none"
                        placeholder="0"
                        disabled={disabled}
                    />
                    {displaySets.length > 1 && !disabled && (
                         <button
                            type="button"
                            onClick={() => removeSet(index)}
                            className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove set"
                        >
                            &times;
                        </button>
                    )}
                </div>
            ))}
            {displaySets.length < 3 && !disabled && (
                <Button type="button" onClick={addSet} size="sm" variant="ghost" className="rounded-full !p-2 h-8 w-8">
                    +
                </Button>
            )}
        </div>
    );
};

export default MatchScoreInput;
