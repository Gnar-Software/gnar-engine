import bin from '../../assets/bin.svg';

const Notes = ({ item, onChange, remove }) => {
    return (
        <div className="note-item">
            <div className="note-item-body">
                <textarea
                    value={item.note || ''}
                    onChange={(e) => onChange({ note: e.target.value })}
                    placeholder="Add a note..."
                />
            </div>
            <button className='bin-icon' onClick={remove}><img src={bin} alt="" /></button>
        </div>
    );
};

export default Notes;
