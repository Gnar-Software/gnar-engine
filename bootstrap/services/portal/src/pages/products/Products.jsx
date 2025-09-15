import React, { useState, useEffect } from "react";
import CrudLayout from "../../layouts/CrudLayout";
import CrudProductList from '../../features/crudProducts/CrudProductList';
import CrudProductSingle from '../../features/crudProducts/CrudProductSingle';
import gnarEngine from "@gnar-engine/js-client";
import CustomSelect from "../../ui/customSelect/CustomSelect";
import arrow from '../../assets/arrow.svg';


const Products = () => {

    const [view, setView] = useState("list");
    const [selectedSingleItemId, setSelectedSingleItemId] = useState(null);
    const [selectedProduct, setProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const [selectedProductIds, setSelectedProductIds] = useState(new Set());
    const [products, setProducts] = useState([]);
    const [message, setMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchProducts = async () => {
        try {
            // Fetch users from gnarEngine SDK
            const data = await gnarEngine.products.getMany();

            console.log('data:', data);

            // Map response data to expected structure
            const productsList = data.products.map(product => ({
                id: product._id,
                image: product.image,
                name: product.name,
                sku: product.skus.map(sku => sku.sku).join(', '),
                categories: product.categories.join(', '),
                createdAt: formatDate(product.createdAt),
            }));

            setProducts(productsList);
            setMessage(productsList.length > 0 ? '' : 'No products found');
        } catch (error) {
            console.error('Error fetching products:', error);
            setMessage('Error fetching products');
            setProducts([]);
        }
    }

    useEffect(() => {
        fetchProducts();
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
        setProduct(null);
    }

    const handleImport = () => {
        console.log('import');
    }

    const handleExport = () => {
        console.log('export');
    }

    const refreshSelectedProduct = () => {
        if (!selectedSingleItemId) {
            return;
        }
        (async () => {
            try {
                const data = await gnarEngine.products.getProduct(selectedSingleItemId);
                setProduct(data.product);
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        })();
    }

    useEffect(() => {
        (async () => {
            if (!selectedSingleItemId) {
                return;
            }
            try {
                // fetch product data
                const data = await gnarEngine.products.getProduct(selectedSingleItemId);
                console.log('single product data:', data);
                setProduct(data.product);

            } catch (error) {
                console.error('Error fetching product:', error);
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
        if (selectedProductIds.size === 0) {
            alert("Please select a product to delete first!");
            return;
        }
        if (!window.confirm(`Are you sure you want to delete ${selectedProductIds.size} product(s)?`)) {
            return;
        }
        (async () => {
            try {
                for (const productId of selectedProductIds) {
                    await gnarEngine.products.delete(productId);
                }
                setSelectedProductIds(new Set());
                setSelectedAction(null);
                await fetchProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
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
                                {/* <button onClick={handleImport} className="add-new">Import</button> */}
                                {/* <button onClick={handleExport} className="add-new">Export</button> */}
                            </div>
                            <div className="controls-right-col">
                                <CustomSelect
                                    name="filter-products"
                                    placeholder="filter by"
                                    options={[
                                        { id: "all", name: "All" }
                                    ]}
                                    labelKey="name"
                                    setSelectedOption={() => {}}
                                    selectedOption={null}
                                />
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
                        <CrudProductList 
                            setSelectedSingleItemId={setSelectedSingleItemId} 
                            setView={() => setView('single')}
                            selectedProductIds={selectedProductIds}
                            setSelectedProductIds={setSelectedProductIds}
                            products={products}
                            message={message} 
                        />
                    </div>
                ) : (
                    <CrudProductSingle 
                        loading={loading} 
                        setLoading={setLoading} 
                        product={selectedProduct} 
                        setView={() => setView('list')} 
                        refreshSelectedProduct={refreshSelectedProduct} 
                        setProduct={setProduct}
                        fetchProducts={fetchProducts} 
                        handleDelete={handleDelete}
                        setSelectedSingleItemId={setSelectedSingleItemId}
                        formatDate={formatDate}
                    />
                )}
            </div>
        </CrudLayout>
    );
}

export default Products;