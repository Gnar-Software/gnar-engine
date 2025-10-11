import { useEffect, useState } from "react";
import RaffleEntriesList from "../../features/raffleEntriesList/RaffleEntriesList";
import CustomSelect from "../../ui/customSelect/CustomSelect";
import gnarEngine from "@gnar-engine/js-client";
import arrow from '../../assets/arrow.svg';


const RaffleEntries = () => {
    const [raffleEntries, setRaffleEntries] = useState([]);
    const [raffles, setRaffles] = useState([]);
    const [message, setMessage] = useState('Please select a raffle to see entries');
    const [selectedRaffle, setSelectedRaffle] = useState(null);
    const [selectedEntryIds, setSelectedEntryIds] = useState(new Set());
    const [selectedAction, setSelectedAction] = useState(null);


    const fetchRaffles = async () => {
        try {
            const data = await gnarEngine.raffles.getRaffles();
            console.log('raffles:', data);

            setRaffles(data.raffle);
        } catch (error) {
            console.error('Error fetching raffles:', error);
            setRaffles([]);
        }
    }

    const fetchRaffleEntries = async (raffleId) => {
        if (!raffleId) return;
    
        try {
            const data = await gnarEngine.raffles.getRaffleEntries(raffleId);
            console.log('raffle entries:', data);
    
            setRaffleEntries(data.entries);
            setMessage(data.entries.length > 0 ? '' : 'No entries found for this raffle');
        } catch (error) {
            console.error('Error fetching raffle entries:', error);
            setRaffleEntries([]);
        }
    }
    
    useEffect(() => {
        fetchRaffles();
    }, []);
    
    useEffect(() => {
        if (selectedRaffle?.id) {
            fetchRaffleEntries(selectedRaffle.id);
        }
    }, [selectedRaffle]);

    const handleAction = async () => {
        if (!selectedAction) {
            alert("Please select an action first!");
            return;
        }
    
        if (selectedAction.id === "export") {
            console.log("Export action triggered");
        }

        if (selectedAction.id === "generate-list") {
            console.log("Generate list action triggered");

            if (!selectedRaffle?.id) {
                alert("Please select a raffle first!");
                return;
            }

            try {
                await gnarEngine.raffles.generateList(selectedRaffle.id)
            } catch (error) {
                console.error("Error generating raffle list:", error);
                alert("Failed to generate raffle list");
            }
        }
    };

    
    return (
        <div className="crud-page">
            <div className="crud-list-cont">
                <div className="crud-list-controls">
                    <div className="controls-left-col">
                        <CustomSelect
                            name="raffle"
                            labelKey="name" 
                            options={raffles}
                            setSelectedOption={setSelectedRaffle}
                            selectedOption={selectedRaffle}
                            placeholder="Select a raffle"
                        />
                    </div>
                    <div className="controls-right-col">
                        <CustomSelect 
                            name="action"
                            placeholder="action"
                            options={[
                                { id: "export", name: "Export" },
                                { id: "generate-list", name: "Generate List" }
                            ]}
                            labelKey="name"
                            setSelectedOption={setSelectedAction}
                            selectedOption={selectedAction}
                        />
                        <button className="arrowButton" onClick={handleAction}><img src={arrow} alt="right arrow icon" /></button>
                    </div>
                </div>

                <RaffleEntriesList 
                    raffleEntries={raffleEntries}
                    setRaffleEntries={setRaffleEntries}
                    selectedEntryIds={selectedEntryIds}
                    setSelectedEntryIds={setSelectedEntryIds}
                    message={message}
                />
            </div>
        </div>
    );
}

export default RaffleEntries;