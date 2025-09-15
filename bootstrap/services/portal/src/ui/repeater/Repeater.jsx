import React from "react";

const Repeater = ({ items = [], setItems, defaultItem, renderRow, buttonText }) => {

    const addItem = () => {
        setItems([...items, defaultItem]);
    }

    const updateItem = (index, newItem) => {
        const newItems = [...items];
        newItems[index] = newItem;
        setItems(newItems);
    };
  
    const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

    return (
        <div>
            {items.length > 0 && items.map((item, index) =>
                renderRow(item, index, (newItem) => updateItem(index, newItem), () => removeItem(index))
            )}
            <div className="button-cont right">
                <button className="mainButton wide" onClick={addItem}>{buttonText}</button>
            </div>
        </div>
    );
};

export default Repeater;
