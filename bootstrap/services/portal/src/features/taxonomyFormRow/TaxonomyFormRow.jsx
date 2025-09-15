import bin from '../../assets/bin.svg';
import CustomSelect from '../../ui/customSelect/CustomSelect';

const TaxonomyFormRow = ({ item, onChange, remove }) => {


    return (
        <div className='form-row'>
            <CustomSelect 
                name="taxonomy"
                placeholder="Select taxonomy"
                options="TBC"
                labelKey="taxonomy"
                setSelectedOption="TBC"
                selectedOption="TBC"
            />
            <CustomSelect 
                name="value"
                placeholder="Select terms"
                options="TBC"
                labelKey="value"
                setSelectedOption="TBC"
                selectedOption="TBC"
            />

            <button className='bin-icon' onClick={remove}><img src={bin} alt="" /></button>
        </div>
    )
}


export default TaxonomyFormRow;