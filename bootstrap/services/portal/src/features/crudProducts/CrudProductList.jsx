import React, { useState, useEffect } from 'react';
import gnarEngine from "@gnar-engine/js-client";
import CustomCheckbox from '../../ui/customCheckbox/CustomCheckbox';

const CrudProductList = ({ setSelectedSingleItemId, setView, selectedProductIds, setSelectedProductIds, products, message }) => {

    const allSelected = products.length > 0 && selectedProductIds.size === products.length;

    const toggleProductSelection = (productId) => {
        setSelectedProductIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedProductIds(new Set());
        } else {
            setSelectedProductIds(new Set(products.map(product => product.id)));
        }
    };

    const handleEditClick = (product) => {
        setSelectedSingleItemId(product.id);
        setView('single');
    };

    const columns = [
        { columnLabel: 'ID', dataKey: 'id' },
        { columnLabel: 'Image', dataKey: 'image' },
        { columnLabel: 'Name', dataKey: 'name' },
        { columnLabel: 'Sku', dataKey: 'sku' },
        { columnLabel: 'Categories', dataKey: 'categories' },
        { columnLabel: 'Date Added', dataKey: 'createdAt' }
    ];

    return (
        <div className="">
            <div className='pagination-labels-cont'>
                <div className='pagination-count'>
                    Showing {products.length} of {products.length} product{products.length !== 1 ? 's' : ''}
                </div>
                <div className="pagination-count">
                    {selectedProductIds.size} of {products.length} product{products.length !== 1 ? 's' : ''} selected
                </div>
            </div>
            <div className='crud-list'>
                <table className='custom-table'>
                    <thead>
                        <tr>
                            <th className="checkbox">
                                <CustomCheckbox
                                    name="selectAll"
                                    checked={allSelected}
                                    setChecked={toggleSelectAll}
                                />
                            </th>
                            {columns.map(column => (
                                <th key={column.columnLabel}>{column.columnLabel}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {message ? (
                            <tr>
                                <td colSpan={columns.length + 1}>{message}</td>
                            </tr>
                        ) : (
                            products.length > 0 ? (
                                products.map(product => (
                                    <tr key={product.id} onClick={() => handleEditClick(product)}>
                                        <td>
                                            <CustomCheckbox 
                                                name={`checkbox-${product.id}`}
                                                checked={selectedProductIds.has(product.id)}
                                                setChecked={() => toggleProductSelection(product.id)}
                                            />
                                        </td>
                                        {columns.map(column => (
                                            <td key={column.dataKey}>{product[column.dataKey]}</td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + 1}>No products found</td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CrudProductList;
