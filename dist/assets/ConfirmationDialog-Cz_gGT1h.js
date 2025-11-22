import{r as l,j as e}from"./index-DD8LHYLV.js";const c=({isOpen:n,onClose:t,onConfirm:r,title:i,message:o})=>(l.useEffect(()=>{const a=s=>{s.key==="Escape"&&t()};return n?(document.body.style.overflow="hidden",window.addEventListener("keydown",a)):document.body.style.overflow="unset",()=>{window.removeEventListener("keydown",a),document.body.style.overflow="unset"}},[n,t]),n?e.jsxs("div",{className:"fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity duration-300","aria-modal":"true",role:"dialog",onClick:t,children:[e.jsxs("div",{className:"bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale",onClick:a=>a.stopPropagation(),children:[e.jsx("h3",{className:"text-xl font-bold text-white mb-4",children:i}),e.jsx("p",{className:"text-gray-300 mb-6",children:o}),e.jsxs("div",{className:"flex justify-end gap-4",children:[e.jsx("button",{onClick:t,className:"bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-lg transition",children:"Annuleren"}),e.jsx("button",{onClick:r,className:"bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition",children:"Verwijderen"})]})]}),e.jsx("style",{children:`
                @keyframes fade-in-scale {
                    from {
                        transform: scale(0.95);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .animate-fade-in-scale {
                    animation: fade-in-scale 0.2s ease-out forwards;
                }
            `})]}):null);export{c as default};
