
/**
 * Gnar Engine - React Front-end framework
 */
const GnarEngineReact = {

    init: async () => {
        GnarEngineReact.components = componentsRegistry;
        //GnarEngineReact.pages = pagesRegistry;
    }
}

await GnarEngineReact.init();

export default GnarEngineReact;
export const { components } = GnarEngineReact;
