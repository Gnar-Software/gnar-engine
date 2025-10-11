# Gnar Engine Client Side SDK

### Users

Just for now:

``` js
    import gnarEngine from '../../gnarengine-sdk/src/app.js';
```

``` js
    import gnarEngine from '@gnar-engine/js-client';

    const user = gnarEngine.user.authenticate();
    const users = gnarEngine.user.getMany();
    const user = gnarEngine.user.getById({id: id});
```