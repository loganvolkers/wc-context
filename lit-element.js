// @ts-check
import {
  observeContext,
  registerProvidedContext,
  notifyContextChange,
} from "./core.js";

const withContext = (Base) => {
  return class extends Base {
    get context() {
      return this.__wcContext || (this.__wcContext = {});
    }

    connectedCallback() {
      super.connectedCallback();
      // @ts-ignore
      const observedContexts = this.constructor.observedContexts;
      if (observedContexts) {
        this.listeners = observedContexts.map((context) =>
          observeContext(this, context)
        );
      }

      //@ts-ignore
      const providedContextConfigs = this.constructor.providedContexts;
      if (providedContextConfigs) {
        const providedContexts =
          this.__wcProvidedContexts || (this.__wcProvidedContexts = {});
        const mappedProps = this.__wcMappedProps || (this.__wcMappedProps = {});

        this.providers = Object.keys(providedContextConfigs).map((name) => {
          const config = providedContextConfigs[name];
          const property =
            typeof config === "string" ? config : config.property;
          providedContexts[name] = property ? this[property] : config.value;
          if (property) {
            mappedProps[name] = property;
          }
          return registerProvidedContext(this, name, providedContexts);
        });
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      if (this.providers) {
        this.providers.forEach((provider) => provider.stop());
      }
      if (this.listeners) {
        this.listeners.forEach((listener) => listener.stop());
      }
    }

    shouldUpdate(changedProperties) {
      const shouldChange = super.shouldUpdate(changedProperties);
      const mappedProps = this.__wcMappedProps;
      if (mappedProps) {
        const providedContexts =
          this.__wcProvidedContexts || (this.__wcProvidedContexts = {});
        Object.keys(mappedProps).forEach((contextName) => {
          const property = mappedProps[contextName];
          if (changedProperties.has(property)) {
            const value = this[property];
            providedContexts[contextName] = value;
            notifyContextChange(this, contextName, value);
          }
        });
      }
      return shouldChange;
    }
  };
};

export { withContext };
