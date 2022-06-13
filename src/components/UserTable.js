import * as React from "react";
import {useTable} from "react-table";

const UserTable = ({data, updateCallback, deleteCallback}) => {
    const columns = React.useMemo(() => [
        {
            Header: "Username",
            id: "username",
            accessor: "username"
        },
        {
            Header: "Email",
            id: "email",
            accessor: "email"
        },
        {
            Header: "Actions",
            id: "actions",
            Cell: ({row}) => (
                <div>
                    <button onClick={() => updateCallback(row.values)} className="mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    </button>
                    <button onClick={() => deleteCallback(row.values)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            )
        }
    ], [updateCallback, deleteCallback]);
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({columns, data})


    return (
        <table {...getTableProps()} className="py-5">
            <thead>
            {headerGroups.map(h => (
                <tr {...h.getHeaderGroupProps()}>
                    {h.headers.map(column => (
                        <th {...column.getHeaderProps()}
                            className="px-4 border-b-2 border-black">{column.render('Header')}</th>
                    ))}
                </tr>
            ))}
            </thead>
            <tbody {...getTableBodyProps()}>
            {rows.map((row, i) => {
                prepareRow(row)
                return (
                    <tr {...row.getRowProps()} className="px-4">
                        {row.cells.map(cell => {
                            return <td {...cell.getCellProps()} className="text-center">{cell.render('Cell')}</td>
                        })}
                    </tr>
                )
            })}
            </tbody>
        </table>
    );
}

export default UserTable;