import { useEffect, useState } from "react";
import gnarEngine from '@gnar-engine/js-client';
import SaveButton from "../../ui/saveButton/SaveButton";
import Repeater from "../../ui/repeater/Repeater";
import { raffleStatuses } from "../../data/data";
import bin from '../../assets/bin.svg';
import RaffleProductFormRow from "../raffleProductFormRow/RaffleProductFormRow";
import CustomSelect from "../../ui/customSelect/CustomSelect";


const CrudRafflesSingle = ({ loading, setLoading, raffle, setView, refreshSelectedRaffle, setRaffle, formatDate, setSelectedSingleItemId, fetchRaffles }) => {
    const initialForm = {
        name: '',
        status: { id: 'draft', status: 'Draft' }, // default to draft status
        description: '',
        prizeDescription: '',
        raffleProducts: [
            { productSku: '', type: '', numEntries: '' }
        ]
    };

    const [formData, setFormData] = useState(initialForm);
    const [validationErrors, setValidationErrors] = useState([]);

    // when raffle prop changes, populate form
    useEffect(() => {
        const raffleStatus = raffleStatuses.find(status => status.id === (raffle?.status || 'draft'));

        if (raffle && raffle.id) {
            setFormData({
                name:               raffle.name            || '',
                status:             raffleStatus,
                description:        raffle.description     || '',
                prizeDescription:   raffle.prize_description || '',
                raffleProducts:     raffle.raffleProducts?.map(p => ({
                    productSku:         p.product_sku   || '',
                    numEntries:         p.num_entries?.toString() || '',
                    type:               p.type           || 'one-time'
                })) || [{ productSku: '', numEntries: '', type: 'one-time' }]
            });
        } else {
            setFormData(initialForm);
        }
    }, [raffle]);


    // handle change for text/textarea inputs
    const handleFieldChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading('loading');
        setValidationErrors([]);

        // prepare payload: convert numEntries to number
        const payload = {
            name: formData.name,
            status: formData.status.id,
            description: formData.description,
            prizeDescription: formData.prizeDescription,
            raffleProducts: formData.raffleProducts.map(p => ({
                productSku: p.productSku,
                type: p.type,
                numEntries: Number(p.numEntries) || 1,
            }))
          };
          

        try {
            let response;
            if (raffle && raffle.id) {
                response = await gnarEngine.raffles.updateRaffle(raffle.id, payload);
            } else {
                response = await gnarEngine.raffles.createRaffle([payload]);
            }

            if (response.error) {
                setValidationErrors(response.error);
                setLoading('error');
            } else {
                setLoading('success');
                setTimeout(() => {
                    setLoading(null)
                }, 3000);

                if (raffle && raffle.id) {
                    refreshSelectedRaffle();
                } else {
                    setRaffle(response.raffle);
                    refreshSelectedRaffle();
                    await fetchRaffles();
                    setView('list');
                }
            }
            } catch (error) {
                console.error('Error saving raffle:', error);
                setValidationErrors(['Error saving raffle']);
                setLoading('error');
                setTimeout(() => setLoading(null), 3000);
            }
    };

    const handleDelete = async () => {
        if (!raffle?.id) 
            return;
        if (window.confirm('Are you sure you want to delete this raffle?')) {
            try {
                setLoading('loading');
                await gnarEngine.raffles.deleteRaffle(raffle.id);
                setLoading('success');
                setTimeout(() => {
                    setLoading(null);
                }, 3000);

                refreshSelectedRaffle();
                await fetchRaffles();
                setView('list');
            } catch (error) {
                console.error('Error deleting raffle:', error);
                setLoading('error');
            }
        }
    };

    return (
        <div className="single-edit raffle">
            {validationErrors.length > 0 && (
                <div className="error-messages">
                    {validationErrors.map((err, i) => <p key={i}>{err}</p>)}
                </div>
            )}

            <div className="single-edit-header">
                <div className="single-edit-header-left">
                    <p><strong>{raffle?.id ? `Raffle# ${raffle.id}` : 'Add New Raffle'}</strong></p>
                    {raffle?.createdAt && <p>Date Added: {formatDate(raffle.createdAt)}</p>}
                </div>
                <div className="single-edit-header-right flex-row-buttons-cont">
                    <button type="button" onClick={() => { setView('list'); setRaffle(null); setSelectedSingleItemId(null); }} className="secondaryButton">Back</button>
                    {raffle?.id && <button type="button" onClick={handleDelete} className="secondaryButton">Delete</button>}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="form-body">
                <div className="form-group">
                    <label>Name</label>
                    <input type="text" value={formData.name} onChange={e => handleFieldChange('name', e.target.value)} />
                </div>

                <CustomSelect 
                    name="status"
                    placeholder="Status"
                    options={raffleStatuses}
                    labelKey="status"
                    setSelectedOption={selectedItem => handleFieldChange('status', selectedItem)}
                    selectedOption={formData.status}
                />

                <div className="form-group">
                    <label>Description</label>
                    <textarea value={formData.description} onChange={e => handleFieldChange('description', e.target.value)} />
                </div>

                <div className="form-group">
                    <label>Prize Description</label>
                    <textarea value={formData.prizeDescription} onChange={e => handleFieldChange('prizeDescription', e.target.value)} />
                </div>

            </form>

            <Repeater
                items={formData.raffleProducts}
                setItems={(newItems) => setFormData({ ...formData, raffleProducts: newItems })}
                defaultItem={{ productSku: '', type: '', numEntries: 1 }}
                buttonText="Add Product"
                renderRow={(item, index, updateItem, remove) => (
                    <RaffleProductFormRow
                    key={index}
                    item={item}
                    onChange={(field, value) => updateItem({ ...item, [field]: value })}
                    remove={remove}
                    />
                )}
            />


            <div className="form-actions">
                <SaveButton
                    save={handleSubmit}
                    loading={loading}
                    textCreate="Add Raffle"
                    textCreateLoading="Saving..."
                    textCreateSuccess="Saved"
                    textCreateError="Error"
                    textUpdate="Save"
                    textUpdateLoading="Updating..."
                    textUpdateSuccess="Updated"
                    textUpdateError="Error"
                    isUpdating={!!raffle?.id}
                />
            </div>
        </div>
    );
};

export default CrudRafflesSingle;
