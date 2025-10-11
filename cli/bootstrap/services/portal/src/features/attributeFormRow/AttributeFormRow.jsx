import bin from '../../assets/bin.svg';
import CustomSelect from '../../ui/customSelect/CustomSelect';

const AttributeFormRow = ({ item, onChange, remove }) => {


    return (
        <div className='form-row'>
            <CustomSelect 
                name="attribute"
                placeholder="Select attribute"
                options="TBC"
                labelKey="attribute"
                setSelectedOption="TBC"
                selectedOption="TBC"
            />
            <CustomSelect 
                name="value"
                placeholder="Select attribute value"
                options="TBC"
                labelKey="value"
                setSelectedOption="TBC"
                selectedOption="TBC"
            />

            <button className='bin-icon' onClick={remove}><img src={bin} alt="" /></button>
        </div>
    )
}


export default AttributeFormRow;