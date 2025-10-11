import React from "react";
import { Link, useNavigate } from "react-router-dom";


export default function GoBack({text}) {

    const navigate = useNavigate();

    function handleGoBack() {
        navigate(-1);
    }

    return (
        <a onClick={handleGoBack}>
            <img className="cross" src={require('../../assets/x.svg').default} alt="back" />
            {text}
        </a>
    )
}