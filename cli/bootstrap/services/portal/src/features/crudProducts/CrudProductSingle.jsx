import React, { useState, useEffect } from 'react';
import CustomSelect from '../../ui/customSelect/CustomSelect';
import CustomMultiSelect from '../../ui/customMultiSelect/CustomMultiSelect';
import gnarEngine from '@gnar-engine/js-client';
import SaveButton from '../../ui/saveButton/SaveButton';
import Repeater from '../../ui/repeater/Repeater';
import arrow from '../../assets/arrow.svg';
import { productStatuses, taxClasses, productCategories } from '../../data/data';
import Skus from '../skus/Skus';
import TaxonomyFormRow from '../taxonomyFormRow/TaxonomyFormRow';



const CrudProductSingle = ({product, setProduct, setView, loading, setLoading, refreshSelectedProduct, fetchProducts, setSelectedSingleItemId, formatDate}) => {

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        categories: [],
        status: '',
        skus: [{}]
    });
    const [validationErrors, setValidationErrors] = useState([]);
    const [selectedAction, setSelectedAction] = useState(null);
    const [productStatus, setProductStatus] = useState(null);
    const [productTaxClass, setProductTaxClass] = useState(null);
    const [prices, setPrices] = useState([]);
    const [inventories, setInventories] = useState([]);
    const [attributes, setAttributes] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);

    // prepare form data for editing existing product
    useEffect(() => {
        console.log('product:', product);
        
        if (product && product._id) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                skus: product.skus?.length ? product.skus : [],
            });

            // Set product status
            const existingStatus = productStatuses.find(status => status.id === product.status);
            setProductStatus(existingStatus || null);

            // iterate through each skus and set taxClass
            product.skus.forEach(sku => {
                const existingTaxClass = taxClasses.find(taxClass => taxClass.id === sku.taxClass);
                setProductTaxClass(existingTaxClass || null);
            });

            // Set product categories
            const newSelectedCategories = []; 

            if (Array.isArray(product.categories) && product.categories.length > 0) {
                product.categories.forEach(category => {
                    const selectedCategory = productCategories.find(cat => cat.id === category);
                    if (selectedCategory) {
                        newSelectedCategories.push(selectedCategory);
                    }
                });
            }

            setSelectedCategories(newSelectedCategories);

            // iterate through each skus and then iterate through each prices
            const newPrices = [];
            product.skus.forEach(sku => {
                if (Array.isArray(sku.prices) && sku.prices.length > 0) {
                    sku.prices.forEach(price => {
                        newPrices.push(price);
                    });
                }
            });

            setPrices(newPrices);

            // Ensure inventories are set correctly
            setInventories(product.inventories || []);

            // Ensure attributes are set correctly
            setAttributes(product.attributes || []);
    
        } else {
            // Default values for new products
            setProduct(null);
            // setFormData({ 
            //     name: '',
            //     description: '',
            //     categories: [],
            //     status: '',
            //     skus: []
            // });
            // setProductStatus(null);
            // setProductTaxClass(null);
            // setPrices([]);
            // setInventories([]);
            // setAttributes([]);
        }
    
        setLoading(null);
    }, [product]);
    
    const handleCategoryChange = (selectedCategory) => {
        console.log('Newly selected category:', selectedCategory);

        let newCategories = [...selectedCategories];

        // remove from current category state if it's already in the list
        if (newCategories.find(category => category.id === selectedCategory.id)) {
            newCategories = newCategories.filter(category => category.id !== selectedCategory.id);
        }
        // otherwise add to the list
        else {
            newCategories.push(selectedCategory);
        }

        // Update the state
        setSelectedCategories(newCategories);

        // Update formData with category IDs
        setFormData(prevData => ({
            ...prevData,
            categories: newCategories.map(category => category.id)
        }));
    };

    const handleStatusChange = (selectedStatus) => {
        setProductStatus(selectedStatus);
        setFormData(prevData => ({
            ...prevData,
            status: selectedStatus ? selectedStatus.id : ''
        }));
    };
    

    // handle form data changes
    const handleChange = (e) => {
        setValidationErrors([]);
        const { name, value } = e.target;
    
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };


    // handle delete user
    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                setLoading('loading');

                await gnarEngine.products.delete(product._id);

                setLoading('success');
                setTimeout(() => {
                    setLoading(null);
                }, 3000);

                refreshSelectedProduct();  
                setView('list');  

            } catch (error) {

                setLoading('error');
                console.error('Error deleting product:', error);
            }
        } else {
            console.log('Deletion canceled');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationErrors([]);
        setLoading('loading');
    
        try {
            if (product) {
                // Editing an existing product
                await gnarEngine.products.update(product._id, { 
                    ...product, 
                    ...(formData || {})
                });
                               
    
                setLoading('success');
                setTimeout(() => {
                    setLoading(null);
                    refreshSelectedProduct();
                }, 3000);
            } else {
                // Creating a new product
                const newProduct = await gnarEngine.products.createProducts([{...formData}]);
                setLoading('success');
                setTimeout(() => {
                    setLoading(null);
                    setProduct(newProduct);
                }, 3000);
            }
        } catch (error) {
            const errors = [];
    
            if (error.response?.data?.errors) {
                Object.keys(error.response.data.errors).forEach((key) => {
                    errors.push(error.response.data.errors[key]);
                });
            } else if (error.response?.data?.message) {
                errors.push(error.response.data.message);
            }
    
            setValidationErrors(errors);
            console.error('Error saving product:', error);
            setLoading('error');
            setTimeout(() => {
                setLoading(null);
            }, 3000);
        }
    };
    


    const routeKey = 'products';
    const handleMenuBtnClick = () => setView({ isBackToList: true });

    // add event listener to sidebar buttons to change view
    useEffect(() => {
        const sidebarButtons = document.querySelectorAll('.sidebar a[href^="/portal/' + routeKey + '"]');
        sidebarButtons.forEach(button => {
            // if it doesn't already have an event listener
            if (!button.hasEventListener) {
                button.addEventListener('click', handleMenuBtnClick);
            }
        })

        // Cleanup to prevent memory leaks and double bindings
        return () => {
            sidebarButtons.forEach(button => {
                button.removeEventListener('click', handleMenuBtnClick);
            });
        };
    }, []);

    return (
        <div className="single-edit product">
            {validationErrors.length > 0 &&
                <div className="error-messages">
                    {validationErrors.map((error, index) => {
                        return <p key={index}>{error}</p>
                    })}
                </div>
            }
            <div className='single-edit-header'>
                <div className='single-edit-header-left'>
                    {product && product._id &&
                        <p><strong>Parent Product:&nbsp;</strong>#{product._id}</p>                    
                    }
                    <p>Date Added: {formatDate(product?.createdAt)}</p>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <input
                                type="text"
                                name="name"
                                placeholder='Product Name'
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                            <CustomSelect 
                                name="status"
                                placeholder="Status"
                                options={productStatuses}
                                labelKey="status"
                                setSelectedOption={handleStatusChange}
                                selectedOption={productStatus}
                            />
                        </div>
                    </form>
                </div>
                <div className='single-edit-header-right'>
                    <div className="flex-row-buttons-cont">
                        <button onClick={() => {
                            setView('list');
                            setProduct(null);
                            setSelectedSingleItemId(null);
                            }} className="secondaryButton">
                                Back
                        </button>
                        <button onClick={handleDelete} className="secondaryButton">Delete</button>
                        <SaveButton
                            save={handleSubmit}
                            loading={loading}
                            textCreate="Add Product"
                            textCreateLoading="Saving..."
                            textCreateSuccess="Saved"
                            textCreateError="Error"
                            textUpdate="Save"
                            textUpdateLoading="Updating..."
                            textUpdateSuccess="Updated"
                            textUpdateError="Error"
                            isUpdating={!!product} 
                        />
                    </div>
                </div>

            </div>
            
            <div className='card'>
                <div className='card-header'>
                    <h2>Description and Category</h2>
                </div>
                <div className='card-content'>
                    <form onSubmit={handleSubmit}>
                        <div className='form-group'>
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className='form-group categories'>
                            <label>Categories</label>
                            <CustomMultiSelect
                                name="categories"
                                placeholder="Select categories"
                                options={productCategories}
                                labelKey="category"
                                setSelectedOption={selected => {
                                    handleCategoryChange(selected); 
                                }}
                                selectedOptions={selectedCategories}
                            />
                        </div>
                    </form>
                </div>
            </div>

            <h2>Grouping</h2>
            <div className='card'>
                <div className='card-header'>
                    <h2>Taxonomy</h2>
                    <h2>Terms</h2>
                    <div></div>
                </div>
                <div className='card-content'>
                    <Repeater
                        items={[product]}
                        setItems={setProduct}
                        defaultItem= {{}}
                        buttonText= "Add grouping"
                        renderRow= {(item, index, updateItem, remove) => (
                            <TaxonomyFormRow
                                key={index}
                                item={item}
                                onChange={(field, value) => updateItem({ ...item, [field]: value })}
                                remove={remove}
                            />
                        )}
                    />
                </div>
            </div>

            <h2>SKUs</h2>
            <Repeater
                items={product?.skus ?? [{}]}
                setItems={(newSkus) => setProduct({ ...product, skus: newSkus })}
                defaultItem={{ sku: "", prices: [{}], taxClass: "" }} 
                buttonText="Add SKU"
                renderRow={(item, index, updateItem, remove) => (
                    <Skus
                        key={index}
                        item={item}
                        onChange={(field, value) => updateItem({ ...item, [field]: value })}
                        remove={remove}
                    />
                )}
            />

        </div>
    );
};

export default CrudProductSingle;
