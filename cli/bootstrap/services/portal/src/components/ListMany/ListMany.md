# ListMany Selection Model

`ListMany` was updated to avoid freezing when the user selects all rows in a very large table.

## The problem

The old implementation stored every selected row index inside a `Set`.

For a table with 10,000 rows, clicking "select all" meant:

1. Building a `Set` with 10,000 indexes
2. Storing that full set in React state
3. Rebuilding the selected rows array from that set

That created a noticeable pause for large tables.

## The new approach

The component now uses a lighter internal selection model:

```js
selectionMode: 'none' | 'partial' | 'all'
selectionSet: Set
```

### How it works

- `none`
  No rows are selected

- `partial`
  `selectionSet` contains the indexes of the selected rows

- `all`
  All rows are considered selected by default, and `selectionSet` contains only the rows that have been manually unselected after selecting all

## Why this is faster

When the user clicks "select all", the component no longer creates a set containing every row index.

Instead it does this:

```js
setSelectionMode('all');
setSelectionSet(new Set());
```

That means the select-all state is represented without storing 10,000 selected entries in React state.

## Row selection behavior

When in `all` mode:

- a row is selected if its index is **not** in `selectionSet`
- unchecking a row adds its index to `selectionSet`
- rechecking that row removes its index from `selectionSet`

When in `partial` mode:

- a row is selected if its index **is** in `selectionSet`

## Callback behavior

The public API did not change.

`onSelectionChange(selectedRows)` still receives the selected row objects.

Internally:

- in `partial` mode, selected rows are mapped from `selectionSet`
- in `all` mode, selected rows are computed as all rows except the excluded ones

## Indeterminate checkbox

The header checkbox now uses the native DOM `indeterminate` property through a ref.

This matches the tri-state selection model more cleanly than styling alone.

## Result

The expensive part of select-all is no longer the state update itself.

For large tables, this removes the main freeze caused by building and storing a full set of selected row indexes.
