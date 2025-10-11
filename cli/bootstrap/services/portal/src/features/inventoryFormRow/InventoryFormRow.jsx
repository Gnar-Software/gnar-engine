import bin from '../../assets/bin.svg';
import { useState } from 'react';
import { currencies, taxClasses } from '../../data/data';
import CustomSelect from '../../ui/customSelect/CustomSelect';

const InventoryFormRow = ({ item, onChange, remove }) => {


    return (
        <div className='form-row'>
            <input 
                type="text"
                name='price' 
                value={item.price} 
                onChange={(e) => onChange("price", Number(e.target.value))} 
            />
            <input 
                type="text"
                name='salePrice' 
                value={item.salePrice} 
                onChange={(e) => onChange("price", Number(e.target.value))} 
            />

            <button className='bin-icon' onClick={remove}><img src={bin} alt="" /></button>
        </div>
    )
}


export default InventoryFormRow;