import bin from '../../assets/bin.svg';
import { useState } from 'react';
import { currencies, taxClasses } from '../../data/data';
import CustomSelect from '../../ui/customSelect/CustomSelect';

const RaffleProductFormRow = ({ item, onChange, remove }) => {
    return (
        <div className='form-row'>
            <div>
                <label>Product SKU</label>
                <input 
                    type="text"
                    name='productSku'
                    value={item.productSku} 
                    onChange={(e) => onChange("productSku", e.target.value)} 
                />
            </div>

            <div>
                <label>Type (one-time / recurring)</label>
                <input 
                    type="text"
                    name='type'
                    value={item.type} 
                    onChange={(e) => onChange("type", e.target.value)} 
                />
            </div>

            <div>
                <label>Number of Entries</label>
                <input 
                    type="number"
                    name='numEntries'
                    min={1}
                    value={item.numEntries} 
                    onChange={(e) => onChange("numEntries", Number(e.target.value))} 
                />
            </div>

            <button type="button" className='bin-icon' onClick={remove}><img src={bin} alt="" /></button>
        </div>
    )
};
  

export default RaffleProductFormRow;