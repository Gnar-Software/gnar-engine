import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

function RichTextInput({ key, label, value, onChange, errorMessage, isValid }) {

    return (
        <div className="rich-text-input">
            {label && <label>{label}</label>}
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
            />
        </div>
    )
}

export default RichTextInput;
