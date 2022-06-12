import * as React from "react";
import {useTable} from "react-table";

const UserTable = ({data, updateCallback}) => {
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
                <button onClick={() => updateCallback(row.values)}>
                    Update
                </button>
            )
        }
    ], [updateCallback]);
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
                            <th {...column.getHeaderProps()}  className="px-4 border-b-2 border-black">{column.render('Header')}</th>
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