import gnarEngine from "@gnar-engine/js-client";
import { useEffect, useState } from "react";
import CrudLayout from "../../layouts/CrudLayout";
import CustomSelect from "../../ui/customSelect/CustomSelect";
import CrudRafflesList from "../../features/crudRaffles/CrudRafflesList";
import CrudRafflesSingle from "../../features/crudRaffles/CrudRafflesSingle";
import arrow from '../../assets/arrow.svg';


const Raffles = () => {
    const [view, setView] = useState("list");
    const [selectedSingleItemId, setSelectedSingleItemId] = useState(null);
    const [raffles, setRaffles] = useState([]);
    const [selectedRaffle, setRaffle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const [selectedRaffleIds, setSelectedRaffleIds] = useState(new Set());
    const [message, setMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    

    const fetchRaffles = async () => {
        try {
            const data = await gnarEngine.raffles.getRaffles();
            console.log('raffles:', data);

            const rafflesList = data.raffle.map(raffle => ({
                id: raffle.id,
                name: raffle.name,
                description: raffle.description,
                prizeDescription: raffle.prizeDescription,
                created_at: formatDate(raffle.created_at),
            }));

            setRaffles(rafflesList);
            setMessage(rafflesList.length > 0 ? '' : 'No raffles found');

        } catch (error) {
            console.error('Error fetching raffles:', error);
            setRaffles([]);
        }
    }

    useEffect(() => {
        fetchRaffles();
    }, []);

    const formatDate = (isoString) => {
        if (!isoString) return "N/A";
    
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "N/A"; // Checks if the date is invalid
    
        return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} at ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    

    const handleAddNew = () => {
        setView("single");
        setSelectedSingleItemId(null);
        setRaffle(null);
    }

    const refreshSelectedRaffle = () => {
        if (!selectedSingleItemId) {
            return;
        }
        (async () => {
            try {
                const data = await gnarEngine.raffles.getRaffle(selectedSingleItemId);
                setRaffle(data.raffle);
            } catch (error) {
                console.error('Error fetching raffles:', error);
            }
        })();
    }

    useEffect(() => {
        (async () => {
            if (!selectedSingleItemId) {
                return;
            }
            try {
                // fetch contact data
                const data = await gnarEngine.raffles.getRaffle(selectedSingleItemId);
                setRaffle(data.raffle);

            } catch (error) {
                console.error('Error fetching raffle:', error);
            }
        })();
    }, [selectedSingleItemId]);

    const handleAction = () => {
        if (!selectedAction) {
            alert("Please select an action first!");
            return;
        }
    
        if (selectedAction.id === "delete") {
            handleDelete();
        } else if (selectedAction.id === "export") {
            console.log("Export action triggered");
        }
    };

    const handleDelete = () => {
        if (selectedRaffleIds.size === 0) {
            alert("Please select a raffle to delete first!");
            return;
        }
        if (!window.confirm(`Are you sure you want to delete ${selectedRaffleIds.size} raffle(s)?`)) {
            return;
        }
        (async () => {
            try {
                for (const raffleId of selectedRaffleIds) {
                    await gnarEngine.raffles.deleteRaffle(raffleId);
                }
                setSelectedRaffleIds(new Set());
                setSelectedAction(null);
                await fetchRaffles();
            } catch (error) {
                console.error('Error deleting raffle:', error);
            }
        })();
    };

    return (
        <CrudLayout
            view={view}
            setView={setView}
            selectedSingleItemId={selectedSingleItemId}
            setSelectedSingleItemId={setSelectedSingleItemId}    
        >
            <div className="crud-page">

                {view === "list" ? (
                    <div className="crud-list-cont">
                        <div className="crud-list-controls">
                            <div className="controls-left-col">
                                <button onClick={handleAddNew} className="add-new">Add new</button>
                            </div>
                            <div className="controls-right-col">
                                <CustomSelect 
                                    name="action"
                                    placeholder="action"
                                    options={[
                                        { id: "delete", name: "Delete" },
                                        // { id: "export", name: "Export" }
                                    ]}
                                    labelKey="name"
                                    setSelectedOption={setSelectedAction}
                                    selectedOption={selectedAction}
                                />
                                <button className="arrowButton" onClick={handleAction}><img src={arrow} alt="right arrow icon" /></button>
                            </div>
                        </div>
                        <CrudRafflesList 
                            setSelectedSingleItemId={setSelectedSingleItemId} 
                            setView={() => setView('single')}
                            selectedRaffleIds={selectedRaffleIds}
                            setSelectedRaffleIds={setSelectedRaffleIds}
                            raffles={raffles}
                            message={message} 
                        />
                    </div>
                ) : (
                    <CrudRafflesSingle
                        loading={loading} 
                        setLoading={setLoading} 
                        raffle={selectedRaffle} 
                        setView={() => setView('list')} 
                        refreshSelectedRaffle={refreshSelectedRaffle} 
                        setRaffle={setRaffle}
                        fetchRaffles={fetchRaffles}
                        formatDate={formatDate}
                        setSelectedSingleItemId={setSelectedSingleItemId}
                    />
                )}
            </div>
        </CrudLayout>
    );
}

export default Raffles;