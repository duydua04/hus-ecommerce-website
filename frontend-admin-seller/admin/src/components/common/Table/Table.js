import React from "react";
import "./Table.scss";

const Table = ({ columns = [], data = [], actions = null }) => {
  return (
    <div className="toolbar__table">
      <table className="table">
        <thead className="table__head">
          <tr className="table__row">
            {columns.map((col, index) => (
              <th
                key={index}
                className={`table__header 
                  ${col.hideOnMobile ? "table__header--hide-mobile" : ""} 
                  ${col.isActions ? "table__header--actions" : ""}`}
              >
                {col.label}
              </th>
            ))}

            {actions && (
              <th className="table__header table__header--actions">Thao tác</th>
            )}
          </tr>
        </thead>

        <tbody className="table__body">
          {data.map((item, rowIndex) => (
            <tr key={rowIndex} className="table__row">
              {columns.map((col, colIndex) => (
                <td
                  key={colIndex}
                  className={`table__cell ${col.className || ""} ${
                    col.hideOnMobile ? "table__cell--hide-mobile" : ""
                  }`}
                >
                  {col.render ? col.render(item[col.key], item) : item[col.key]}
                </td>
              ))}

              {actions && (
                <td className="table__cell table__cell--actions">
                  {actions.map((act, i) => (
                    <button
                      key={i}
                      className={act.className}
                      onClick={() => act.onClick(item)}
                    >
                      {act.label}
                    </button>
                  ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
