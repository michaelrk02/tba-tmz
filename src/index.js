import React from 'react';
import ReactDOM from 'react-dom';

import './css/tmz.css';
import App from './components/App.jsx';

window.addEventListener('load', function() {
    ReactDOM.render(React.createElement(App), document.getElementById('app'));
});

