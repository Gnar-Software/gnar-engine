import React, { useEffect } from 'react';
import CustomSelect from '../../ui/customSelect/CustomSelect';
import Repeater from '../../ui/repeater/Repeater';
import PriceFormRow from '../priceFormRow/PriceFormRow';
import InventoryFormRow from '../inventoryFormRow/InventoryFormRow';
import AttributeFormRow from '../attributeFormRow/AttributeFormRow';
import { taxClasses } from '../../data/data';
import binWhite from '../../assets/bin-white.svg';


const Skus = ({ item, onChange, remove, showLabels }) => {

    // useEffect(() => {
    //     console.log(item);
    // }, [item]);

    
    return (
        <>
            <div className='card'>
                <div className='card-header'>
                    <h2>SKU: {item.sku || ''}</h2>
                    <button className="bin-icon white" onClick={remove}><img src={binWhite} alt="Remove" /></button>
                </div>
                <div className='card-content'>
                    <div>
                        <div className='form-cont'>
                            <h2>SKU</h2>
                            <div className='input-cont'>
                                <input
                                    type="text"
                                    name="skus"
                                    value={item.sku || ''}
                                    onChange={(e) => onChange('sku', e.target.value)}                                           
                                    required
                                />
                            </div>
                        </div>
                        <div className='form-cont'>
                            <h2>Tax Class</h2>
                            <div className="tax-cont">
                                <CustomSelect 
                                    name="taxClass"
                                    placeholder="Tax Class"
                                    options={taxClasses}
                                    labelKey="taxClass"
                                    setSelectedOption={(selected) => onChange("taxClass", selected.id)}
                                    selectedOption={taxClasses.find(tc => tc.id === item.taxClass) || null}
                                />
                            </div>
                        </div>
                    </div>
                    {/* <h2>Attributes</h2>
                    <Repeater
                        items={attributes}
                        setItems={setAttributes}
                        defaultItem={{ name: '', value: '' }}
                        buttonText="Add new attribute"
                        renderRow={(item, index, updateItem, remove) => (
                            <AttributeFormRow
                                key={index}
                                item={item}
                                onChange={(field, value) => updateItem({ ...item, [field]: value })}
                                remove={remove}
                                product={product} 
                            />
                        )}
                    /> */}

                    <h2>Prices</h2>
                    <Repeater
                        items={item?.prices ?? [{}]}
                        setItems={(prices) => onChange('prices', prices)}
                        defaultItem={{ price: 0, currency: "GBP", type: "regular" }}
                        buttonText="Add new price list"
                        renderRow={(item, index, updateItem, remove) => (
                            <PriceFormRow
                                key={index}
                                item={item}
                                onChange={(field, value) => updateItem({ ...item, [field]: value })}
                                remove={remove}
                                showLabels={index === 0}
                            />
                        )}
                    />

                    {/* <h2>Inventory</h2>
                    <Repeater
                        items={inventories}
                        setItems={setInventories}
                        defaultItem={{ stock: 0, warehouse: "Main" }}
                        buttonText="Add new allocation"
                        renderRow={(item, index, updateItem, remove) => (
                            <InventoryFormRow
                                key={index}
                                item={item}
                                onChange={(field, value) => updateItem({ ...item, [field]: value })}
                                remove={remove}
                                product={product} 
                            />
                        )}
                    /> */}
                </div>
            </div>
        </>
    );
};

export default Skus;