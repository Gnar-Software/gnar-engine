import { useState, useEffect } from 'react';
import bin from '../../assets/bin.svg';
import { currencies, productPriceTypes, productIntervals } from '../../data/data';
import CustomSelect from '../../ui/customSelect/CustomSelect';

const PriceFormRow = ({ item, onChange, remove, showLabels }) => {

    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [selectedInterval, setSelectedInterval] = useState(null);
    const [selectedPriceType, setSelectedPriceType] = useState(null);

    useEffect(() => {
        if (item.currency) {
            const currency = currencies.find(currency => {
                return currency.id === item.currency;
            });
            setSelectedCurrency(currency || null);
        }

        if (item.type) {
            const priceType = productPriceTypes.find(priceType => {
                return priceType.id === item.type;
            });
            setSelectedPriceType(priceType || null);
        }

        if (item.interval) {
            const interval = productIntervals.find(interval => {
                return interval.id === item.interval;
            }
            );
            setSelectedInterval(interval || null);
        }
        
    }, [item]);

    return (
        <div className='form-row'>
            <div className="input-cont">
                {showLabels && <label>Currency</label>}
                <CustomSelect 
                    name="currency"
                    placeholder="Select currency"
                    options={currencies}
                    labelKey="currency"
                    setSelectedOption={(currency) => onChange("currency", currency.id)}
                    selectedOption={selectedCurrency}
                />
            </div>

            <div className="input-cont">
                {showLabels && <label>Price Type</label>}
                <CustomSelect 
                    name="type"
                    placeholder="Select price type"
                    options={productPriceTypes}
                    labelKey="type"
                    setSelectedOption={(type) => onChange("type", type.id)}
                    selectedOption={selectedPriceType}
                />
            </div>

            {item.type === 'recurring' && (
                <div className="input-cont">
                    {showLabels && <label>Interval</label>}
                    <CustomSelect 
                        name="interval"
                        placeholder="Select interval"
                        options={productIntervals}
                        labelKey="interval"
                        setSelectedOption={(interval) => onChange("interval", interval.id)}
                        selectedOption={selectedInterval}
                    />
                </div>
            )}

            <div className="input-cont">
                {showLabels && <label>Price</label>}
                <input 
                    type="text"
                    name='price' 
                    value={item.price} 
                    onChange={(e) => onChange("price", Number(e.target.value))} 
                />
            </div>

            <div className="input-cont">
                {showLabels && <label>Sale price</label>}
                <input 
                    type="text"
                    name='salePrice' 
                    value={item.salePrice} 
                    onChange={(e) => onChange("salePrice", Number(e.target.value))} 
                />
            </div>

            <button className='bin-icon' onClick={remove}><img src={bin} alt="" /></button>
        </div>
    );
}

export default PriceFormRow;
